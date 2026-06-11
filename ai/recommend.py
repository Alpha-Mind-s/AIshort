"""
AI shot — AI 推荐引擎

技术选型: 协同过滤 + 内容推荐 + 热门降权（MVP 阶段）
- 基于用户收藏/观看历史
- 短剧标签相似度
- 热门榜单（带时间衰减）
- 后期升级为深度学习推荐模型
"""

import redis
import numpy as np
from loguru import logger

from config import settings


class RecommendEngine:
    """推荐引擎"""

    def __init__(self):
        self.redis = redis.Redis.from_url(settings.REDIS_ADDR, decode_responses=True)

    # ------------------------------------------------------------------
    # 推荐入口
    # ------------------------------------------------------------------

    def get_recommendations(
        self, user_id: int = None, category_id: int = None,
        limit: int = 20, offset: int = 0
    ) -> list[int]:
        """
        获取推荐短剧 ID 列表

        推荐策略（混合权重）:
        - 热门推荐: 60%（新用户 / 冷启动）
        - 协同过滤: 30%（有行为历史的用户）
        - 内容推荐: 10%（基于标签相似度）

        Args:
            user_id: 用户 ID（未登录则为 None）
            category_id: 分类筛选
            limit: 返回数量
            offset: 分页偏移

        Returns:
            drama_id 列表
        """
        logger.info("推荐请求 user={} category={}", user_id, category_id)

        if user_id:
            # 已登录用户: 混合推荐
            hot = self._hot_recommend(limit * 2)
            cf = self._collaborative_filter(user_id, limit)
            content = self._content_based(user_id, limit)

            # 合并去重（保留顺序优先级: CF > Content > Hot）
            merged = list(dict.fromkeys(cf + content + hot))
        else:
            # 未登录: 纯热门推荐
            merged = self._hot_recommend(limit * 2)

        # 分类筛选
        if category_id:
            merged = self._filter_by_category(merged, category_id)

        # 分页
        result = merged[offset : offset + limit]
        logger.info("推荐结果: {} 条", len(result))
        return result

    # ------------------------------------------------------------------
    # 热门推荐
    # ------------------------------------------------------------------

    def _hot_recommend(self, limit: int) -> list[int]:
        """
        热门短剧（带时间衰减）

        Redis Key: hot:daily → DramaID[]（按热度排序）
        """
        hot_ids = self.redis.zrevrange("hot:daily", 0, limit - 1)
        if hot_ids:
            return [int(did) for did in hot_ids]

        # 如果 Redis 中没有，返回空（由内容服务补充默认热门）
        logger.debug("热门缓存为空")
        return []

    # ------------------------------------------------------------------
    # 协同过滤
    # ------------------------------------------------------------------

    def _collaborative_filter(self, user_id: int, limit: int) -> list[int]:
        """
        协同过滤推荐

        基于用户收藏历史，找到相似用户，推荐他们也喜欢的短剧

        简化版 MVP:
        - 构建 user-drama 交互矩阵（Redis Set）
        - 计算 Jaccard 相似度
        - 推荐相似用户收藏但当前用户未收藏的短剧
        """
        # 获取当前用户收藏的短剧
        user_favorites_key = f"user:{user_id}:favorites"
        user_dramas = self.redis.smembers(user_favorites_key)

        if not user_dramas:
            logger.debug("用户 {} 无收藏历史，跳过协同过滤", user_id)
            return []

        # 找到也收藏了这些短剧的其他用户
        candidate_dramas = {}
        for drama_id in user_dramas:
            # 获取同样收藏了此短剧的用户
            drama_fans_key = f"drama:{drama_id}:fans"
            similar_users = self.redis.smembers(drama_fans_key)

            for uid in similar_users:
                if int(uid) == user_id:
                    continue
                # 获取该相似用户的收藏
                their_favs = self.redis.smembers(f"user:{uid}:favorites")
                for did in their_favs:
                    if did not in user_dramas:
                        candidate_dramas[did] = candidate_dramas.get(did, 0) + 1

        # 按推荐次数排序
        sorted_candidates = sorted(candidate_dramas.items(), key=lambda x: -x[1])
        result = [int(did) for did, _ in sorted_candidates[:limit]]

        logger.debug("协同过滤推荐: {} 条", len(result))
        return result

    # ------------------------------------------------------------------
    # 内容推荐
    # ------------------------------------------------------------------

    def _content_based(self, user_id: int, limit: int) -> list[int]:
        """
        基于内容的推荐

        基于用户收藏短剧的标签，推荐相似标签的短剧
        """
        user_favorites_key = f"user:{user_id}:favorites"
        user_dramas = self.redis.smembers(user_favorites_key)

        if not user_dramas:
            return []

        # 收集用户偏好标签
        tag_scores = {}
        for drama_id in user_dramas:
            tags_key = f"drama:{drama_id}:tags"
            tags = self.redis.smembers(tags_key)
            for tag in tags:
                tag_scores[tag] = tag_scores.get(tag, 0) + 1

        if not tag_scores:
            return []

        # 找到拥有这些标签的其他短剧
        candidate_scores = {}
        for tag, score in tag_scores.items():
            tag_dramas_key = f"tag:{tag}:dramas"
            drama_ids = self.redis.smembers(tag_dramas_key)
            for did in drama_ids:
                if did not in user_dramas:
                    candidate_scores[did] = candidate_scores.get(did, 0) + score

        sorted_candidates = sorted(candidate_scores.items(), key=lambda x: -x[1])
        result = [int(did) for did, _ in sorted_candidates[:limit]]

        logger.debug("内容推荐: {} 条", len(result))
        return result

    # ------------------------------------------------------------------
    # 辅助方法
    # ------------------------------------------------------------------

    def _filter_by_category(self, drama_ids: list[int], category_id: int) -> list[int]:
        """按分类筛选短剧 ID 列表"""
        return [
            did for did in drama_ids
            if self.redis.sismember(f"category:{category_id}:dramas", str(did))
        ]

    def update_hot_ranking(self, drama_id: int, score_delta: float):
        """
        更新短剧热度分数（由内容服务调用）

        Redis Sorted Set: hot:daily
        时间衰减: score = views * 0.7 + favorites * 0.2 + comments * 0.1
        """
        self.redis.zincrby("hot:daily", score_delta, str(drama_id))
        self.redis.expire("hot:daily", 86400)  # 24h TTL
