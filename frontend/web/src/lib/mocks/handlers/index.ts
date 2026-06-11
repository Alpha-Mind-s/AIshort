import { authHandlers } from "./auth";
import { dramaHandlers } from "./drama";
import { favoritesHandlers } from "./favorites";
import { commentsHandlers } from "./comments";
import { subscriptionsHandlers } from "./subscriptions";

export const handlers = [
  ...authHandlers,
  ...dramaHandlers,
  ...favoritesHandlers,
  ...commentsHandlers,
  ...subscriptionsHandlers,
];
