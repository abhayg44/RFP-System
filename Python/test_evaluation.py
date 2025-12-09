import json
from ai_service import evaluate_proposals

# Test with sample proposals
test_proposals = [
    {
        "_id": "test1",
        "vendor_id": "v1",
        "vendor_email": "vendor1@test.com",
        "extracted": {
            "price_per_piece": 100,
            "total_price": 1000,
            "quantity": 10,
            "delivery_time": "5 days",
            "warranty": "1 year",
            "terms": "Net 30"
        }
    },
    {
        "_id": "test2",
        "vendor_id": "v2",
        "vendor_email": "vendor2@test.com",
        "extracted": {
            "price_per_piece": 90,
            "total_price": 900,
            "quantity": 10,
            "delivery_time": "7 days",
            "warranty": "2 years",
            "terms": "Net 30"
        }
    },
    {
        "_id": "test3",
        "vendor_id": "v3",
        "vendor_email": "vendor3@test.com",
        "extracted": {
            "price_per_piece": 110,
            "total_price": 1100,
            "quantity": 10,
            "delivery_time": "3 days",
            "warranty": "6 months",
            "terms": "Net 60"
        }
    }
]

print("Testing AI evaluation...")
print("=" * 50)

try:
    result = evaluate_proposals(test_proposals)
    print("SUCCESS! Evaluation completed")
    print("\nResults:")
    print(json.dumps(result, indent=2, default=str))
except Exception as e:
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
