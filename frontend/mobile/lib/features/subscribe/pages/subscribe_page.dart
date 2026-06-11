import 'package:flutter/material.dart';

/// Subscription plan selection page.
class SubscribePage extends StatefulWidget {
  const SubscribePage({super.key});

  @override
  State<SubscribePage> createState() => _SubscribePageState();
}

class _SubscribePageState extends State<SubscribePage> {
  int _selected = 1; // default: yearly

  final _plans = const [
    _Plan('Monthly', 9.99, 'monthly', false, 0),
    _Plan('Quarterly', 24.99, 'quarterly', true, 17),
    _Plan('Yearly', 79.99, 'yearly', false, 33),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Choose Your Plan', style: TextStyle(fontWeight: FontWeight.bold))),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SizedBox(height: 8),
          Text('Unlock unlimited access to AI-localized short dramas',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: Colors.grey.shade400),
          ),
          const SizedBox(height: 32),

          // Plan cards
          ..._plans.asMap().entries.map((entry) {
            final i = entry.key;
            final plan = entry.value;
            final isSelected = _selected == i;

            return GestureDetector(
              onTap: () => setState(() => _selected = i),
              child: Container(
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isSelected ? Colors.purple : Colors.white.withAlpha(20), width: isSelected ? 2 : 1),
                  color: isSelected ? Colors.purple.withAlpha(20) : Colors.white.withAlpha(5),
                ),
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Radio<int>(value: i, groupValue: _selected, onChanged: (v) => setState(() => _selected = v!), activeColor: Colors.purple),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(plan.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                              if (plan.isPopular) ...[
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(color: Colors.purple, borderRadius: BorderRadius.circular(6)),
                                  child: const Text('Popular', style: TextStyle(fontSize: 10, color: Colors.white)),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text('Full access, HD streaming, offline downloads', style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('\$${plan.price.toStringAsFixed(2)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        Text(plan.billingName, style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
                        if (plan.savings > 0)
                          Text('Save ${plan.savings}%', style: const TextStyle(fontSize: 11, color: Colors.green)),
                      ],
                    ),
                  ],
                ),
              ),
            );
          }),

          const SizedBox(height: 24),

          // CTA
          ElevatedButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Redirecting to ${_plans[_selected].name} checkout...')),
              );
            },
            child: Text('Start ${_plans[_selected].name}'),
          ),

          const SizedBox(height: 12),
          Text('Cancel anytime. No long-term commitment.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
          ),
        ],
      ),
    );
  }
}

class _Plan {
  final String name;
  final double price;
  final String billingName;
  final bool isPopular;
  final int savings;

  const _Plan(this.name, this.price, this.billingName, this.isPopular, this.savings);
}
