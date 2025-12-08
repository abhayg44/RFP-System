import json
import requests
from typing import Dict, Any
import os
import re
from dotenv import load_dotenv

load_dotenv()

OLLAMA_API_URL = os.getenv("API_URL", "http://localhost:11434/api/chat")
MODEL = "deepseek-r1:1.5b"


def parse_budget(budget_value: Any) -> float:
    if budget_value is None:
        return None
    if isinstance(budget_value, (int, float)):
        return float(budget_value)
    if isinstance(budget_value, str):
        # Remove currency symbols and commas
        clean = re.sub(r'[$,]', '', budget_value.strip())
        try:
            return float(clean)
        except ValueError:
            return None
    return None


def flatten_string_value(value: Any) -> str:
    if value is None:
        return None
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return ", ".join([f"{k}: {v}" for k, v in value.items()])
    if isinstance(value, (list, tuple)):
        return ", ".join([str(v) for v in value])
    return str(value)


def extract_json_from_response(text: str) -> Dict[str, Any]:
    if not text:
        raise ValueError("Empty response from AI")

    text = re.sub(r'<\/?think>', '', text, flags=re.IGNORECASE).strip()
    text = re.sub(r'<[^>]+>', '', text).strip()
    if "```json" in text:
        start = text.find("```json") + len("```json")
        end = text.find("```", start)
        if end != -1:
            snippet = text[start:end].strip()
            try:
                return json.loads(snippet)
            except json.JSONDecodeError:
                pass
    if "```" in text:
        start = text.find("```") + 3
        end = text.find("```", start)
        if end != -1:
            snippet = text[start:end].strip()
            try:
                return json.loads(snippet)
            except json.JSONDecodeError:
                pass

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    def find_balanced_json(s: str):
        length = len(s)
        for i, ch in enumerate(s):
            if ch == '{':
                depth = 0
                for j in range(i, length):
                    if s[j] == '{':
                        depth += 1
                    elif s[j] == '}':
                        depth -= 1
                        if depth == 0:
                            candidate = s[i:j+1]
                            try:
                                json.loads(candidate)
                                return candidate
                            except json.JSONDecodeError:
                                break
            elif ch == '[':
                depth = 0
                for j in range(i, length):
                    if s[j] == '[':
                        depth += 1
                    elif s[j] == ']':
                        depth -= 1
                        if depth == 0:
                            candidate = s[i:j+1]
                            try:
                                json.loads(candidate)
                                return candidate
                            except json.JSONDecodeError:
                                break
        return None

    candidate = find_balanced_json(text)
    if candidate:
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    brace_start = text.find('{')
    brace_end = text.rfind('}')
    if brace_start != -1 and brace_end != -1 and brace_end > brace_start:
        maybe = text[brace_start:brace_end+1]
        try:
            return json.loads(maybe)
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not parse JSON from AI response. Preview: {text[:800]}")


def normalize_null_fields(data: Dict[str, Any], field_defaults: Dict[str, Any]) -> Dict[str, Any]:
    normalized = dict(data)
    for field, default_val in field_defaults.items():
        if field not in normalized or normalized[field] is None:
            normalized[field] = default_val
    return normalized


def call_ollama(prompt: str) -> str:
    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False  
    }
    
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(
            OLLAMA_API_URL,
            json=payload,
            headers=headers,
            timeout=120  
        )
        response.raise_for_status()
        
        data = response.json()
        if "message" in data:
            return data["message"]["content"]
        else:
            raise ValueError(f"Unexpected response format: {data}")
            
    except requests.RequestException as e:
        raise ConnectionError(f"Failed to connect to Ollama at {OLLAMA_API_URL}: {e}")


def process_client_request(text: str) -> Dict[str, Any]:
    
    json_example = '{"title":"...", "description":"...", "budget":"...", "items":[{"name":"...", "quantity":"...", "specs":"a string describing the specifications"}], "delivery_time":"...", "payment_terms":"...", "warranty":"..."}'
    prompt = f"""Extract structured RFP from this text:

"{text}"

Return ONLY a JSON object in this exact format (no markdown, no code blocks, no extra text):
{json_example}"""
    
    response_text = call_ollama(prompt)
    structured_data = extract_json_from_response(response_text)
    
    if isinstance(structured_data, list):
        structured_data = {"items": structured_data}
    
    structured_data = normalize_null_fields(structured_data, {
        "title": "Untitled RFP",
        "description": "None specified",
        "budget": "Not yet decided",
        "items": [],
        "delivery_time": "None specified",
        "payment_terms": "None specified",
        "warranty": "None specified"
    })
    
    if "budget" in structured_data:
        structured_data["budget"] = parse_budget(structured_data["budget"])
    
    if "items" in structured_data and isinstance(structured_data["items"], list):
        for item in structured_data["items"]:
            if isinstance(item, dict) and "specs" in item and isinstance(item["specs"], dict):
                # Convert specs dict to string representation
                item["specs"] = ", ".join([f"{k}: {v}" for k, v in item["specs"].items()])
    
    if "warranty" in structured_data:
        structured_data["warranty"] = flatten_string_value(structured_data["warranty"])
    
    if "payment_terms" in structured_data:
        structured_data["payment_terms"] = flatten_string_value(structured_data["payment_terms"])
    
    if "delivery_time" in structured_data:
        structured_data["delivery_time"] = flatten_string_value(structured_data["delivery_time"])
    
    return structured_data


def process_vendor_proposal(text: str) -> Dict[str, Any]:
    json_example = '{"price_per_piece": null, "total_price": null, "quantity": null, "terms": "...", "warranty": "...", "delivery_time": "..."}'
    prompt = f"""Extract structured proposal from this text:

"{text}"

Return ONLY a JSON object in this exact format (no markdown, no code blocks, no extra text):
{json_example}

Notes:
- If vendor provides only a single price, prefer returning it as `price_per_piece`.
- `total_price` is the overall total (price_per_piece * quantity) if provided or calculable.
"""
    
    response_text = call_ollama(prompt)
    structured_data = extract_json_from_response(response_text)
    
    structured_data = normalize_null_fields(structured_data, {
        "price_per_piece": None,
        "total_price": None,
        "quantity": None,
        "terms": "",
        "warranty": "",
        "delivery_time": ""
    })
    
    if "terms" in structured_data:
        structured_data["terms"] = flatten_string_value(structured_data["terms"])
    
    if "warranty" in structured_data:
        structured_data["warranty"] = flatten_string_value(structured_data["warranty"])
    
    if "delivery_time" in structured_data:
        structured_data["delivery_time"] = flatten_string_value(structured_data["delivery_time"])
    
    ppp = structured_data.get("price_per_piece")
    total = structured_data.get("total_price")
    qty = structured_data.get("quantity")

    def parse_money(val):
        if val is None:
            return None
        if isinstance(val, (int, float)):
            return float(val)
        if isinstance(val, str):
            clean = re.sub(r'[$,]', '', val.strip())
            try:
                return float(clean)
            except ValueError:
                return None
        return None

    ppp = parse_money(ppp)
    total = parse_money(total)
    try:
        qty = int(qty) if qty is not None else None
    except Exception:
        try:
            qty = int(float(qty))
        except Exception:
            qty = None

    if ppp is not None and (total is None) and (qty is not None):
        total = round(ppp * qty, 2)

    if total is not None and (ppp is None) and (qty is not None) and qty != 0:
        ppp = round(total / qty, 2)

    if ppp is None and "price" in structured_data:
        ppp = parse_money(structured_data.get("price"))
        if ppp is not None and (total is None) and (qty is not None):
            total = round(ppp * qty, 2)

    structured_data["price_per_piece"] = ppp
    structured_data["total_price"] = total
    structured_data["price"] = ppp
    
    return structured_data


def generate_vendor_message(rfp_data: Dict[str, Any]) -> str:
    items_str = "\n".join([
        f"  - {item.get('name', 'N/A')}: {item.get('quantity', 'N/A')} units ({item.get('specs', 'N/A')})"
        for item in rfp_data.get("items", [])
    ])
    
    message = f"""New RFP Received:

Title: {rfp_data.get('title', 'N/A')}

Description: {rfp_data.get('description', 'N/A')}

Budget: ${rfp_data.get('budget', 'Not specified')}

Items Needed:
{items_str if items_str else '  (No items specified)'}

Delivery Time Required: {rfp_data.get('delivery_time', 'Not specified')}

Payment Terms: {rfp_data.get('payment_terms', 'Not specified')}

Warranty Requirements: {rfp_data.get('warranty', 'Not specified')}

Please submit your proposal with pricing and delivery timeline."""
    
    return message


def generate_client_message(proposal_data: Dict[str, Any]) -> str:
    ppp = proposal_data.get('price_per_piece')
    total = proposal_data.get('total_price')
    price_legacy = proposal_data.get('price')
    ppp_display = f"${ppp}" if ppp is not None else (f"${price_legacy}" if price_legacy is not None else "Not specified")
    total_display = f"${total}" if total is not None else "Not specified"

    message = f"""Vendor Proposal Received:

Price per unit: {ppp_display}

Total price: {total_display}

Quantity: {proposal_data.get('quantity', 'Not specified')} units

Terms: {proposal_data.get('terms', 'Not specified')}

Warranty: {proposal_data.get('warranty', 'Not specified')}

Delivery Time: {proposal_data.get('delivery_time', 'Not specified')}

Please review and let us know if you would like to accept this proposal or request modifications."""
    
    return message


def evaluate_proposals(proposals: list) -> Dict[str, Any]:
    proposals_text = "\n\n".join([
        f"Proposal {i+1}:\n"
        f"- Vendor Email: {p.get('vendor_email')}\n"
        f"- Vendor ID: {p.get('vendor_id')}\n"
        f"- Proposal ID: {p.get('_id')}\n"
        f"- Price per piece: ${p.get('extracted', {}).get('price_per_piece', 'N/A')}\n"
        f"- Total price: ${p.get('extracted', {}).get('total_price', 'N/A')}\n"
        f"- Quantity: {p.get('extracted', {}).get('quantity', 'N/A')}\n"
        f"- Delivery time: {p.get('extracted', {}).get('delivery_time', 'N/A')}\n"
        f"- Warranty: {p.get('extracted', {}).get('warranty', 'N/A')}\n"
        f"- Payment Terms: {p.get('extracted', {}).get('terms', 'N/A')}"
        for i, p in enumerate(proposals)
    ])
    
    json_example = '''{
    "best_price": [{
        "proposal_index": 0,
        "reasoning": "why this has best price"
    },{
        "proposal_index": 1,
        "reasoning": "why this has second best price"
    },{
        "proposal_index": 2,
        "reasoning": "why this has third best price"
    }],
    "best_warranty": [{
        "proposal_index": 0,
        "reasoning": "why this has best warranty"
    },{
        "proposal_index": 1,
        "reasoning": "why this has second best warranty"
    },{
        "proposal_index": 2,
        "reasoning": "why this has third best warranty"
    }],
    "best_delivery": [{
        "proposal_index": 0,
        "reasoning": "why this has best delivery"
    },{
        "proposal_index": 2,
        "reasoning": "why this has second best delivery"
    },{
        "proposal_index": 3,
        "reasoning": "why this has third best delivery"
    }],
    "best_quantity": [{
        "proposal_index": 0,
        "reasoning": "why this has best quantity"
    },{
        "proposal_index": 1,
        "reasoning": "why this has second best quantity"
    },{
        "proposal_index": 2,
        "reasoning": "why this has third best quantity"
    }],
    "overall_best": [{
        "proposal_index": 0,
        "reasoning": "comprehensive reasoning for overall best",
        "scores": {
            "price_score": 8,
            "warranty_score": 7,
            "delivery_score": 9,
            "overall_score": 8
        }
    },{
        "proposal_index": 1,
        "reasoning": "comprehensive reasoning for overall second best",
        "scores": {
            "price_score": 7,
            "warranty_score": 6,
            "delivery_score": 8,
            "overall_score": 7
        }
    },{
        "proposal_index": 2,
        "reasoning": "comprehensive reasoning for overall third best",
        "scores": {
            "price_score": 6,
            "warranty_score": 5,
            "delivery_score": 7,
            "overall_score": 6
        }
    }]
}'''
    
    prompt = f"""You are an expert procurement analyst. Evaluate these proposals and rank them.

Proposals:
{proposals_text}

Analyze and rank proposals in these categories:
1. BEST PRICE: Lowest total cost (consider both price_per_piece and total_price)
2. BEST WARRANTY: Longest/most comprehensive warranty coverage
3. BEST DELIVERY: Fastest delivery time
4. BEST QUANTITY: Most appropriate quantity offered (if applicable)
5. OVERALL BEST: Best value considering all factors (price, delivery, warranty, terms)

IMPORTANT: Return a JSON OBJECT (not array) with 5 keys: best_price, best_warranty, best_delivery, best_quantity, overall_best
Each key contains an array of 3 ranking objects with proposal_index, reasoning, and scores fields.
Use different proposal_index values in each category's top 3.

Return ONLY a JSON object in this exact format (no markdown, no code blocks):
{json_example}"""
    
    try:
        response_text = call_ollama(prompt)
        result = extract_json_from_response(response_text)
        
        if isinstance(result, list):
            print(f"AI returned list instead of dict, converting to expected format...")
            ranking_list = result[:3] if len(result) >= 3 else result
            result = {
                "best_price": ranking_list,
                "best_warranty": ranking_list.copy(),
                "best_delivery": ranking_list.copy(),
                "best_quantity": ranking_list.copy(),
                "overall_best": ranking_list.copy()
            }
        
        if not isinstance(result, dict):
            print(f"Warning: AI returned {type(result).__name__}, cannot process.")
            raise ValueError(f"Expected dict from AI, got {type(result).__name__}")
    except Exception as e:
        print(f"AI call or parsing failed: {e}")
        raise 
    
    try:
        best_price_list = result.get("best_price", [])
        best_warranty_list = result.get("best_warranty", [])
        best_delivery_list = result.get("best_delivery", [])
        best_quantity_list = result.get("best_quantity", [])
        overall_best_list = result.get("overall_best", [])
        
        def get_top_n(ranking_list, n=3, category_name=""):
            top = []
            seen_indices = set()
            seen_vendor_ids = set()
            
            for i, rank in enumerate(ranking_list):
                if len(top) >= n:
                    break
                    
                idx = rank.get("proposal_index")
                if idx is None:
                    print(f"Warning: {category_name} rank {i+1} missing proposal_index")
                    continue
                    
                if not (0 <= idx < len(proposals)):
                    print(f"Warning: {category_name} has invalid proposal_index {idx} (valid: 0-{len(proposals)-1})")
                    continue
                
                if idx in seen_indices:
                    vendor = proposals[idx].get('vendor_email', 'N/A')
                    print(f"Warning: {category_name} has duplicate proposal_index {idx} (vendor: {vendor}) - skipping")
                    continue
                
                vendor_id = proposals[idx].get('vendor_id')
                if vendor_id and vendor_id in seen_vendor_ids:
                    vendor = proposals[idx].get('vendor_email', 'N/A')
                    print(f"Warning: {category_name} has duplicate vendor {vendor} - skipping")
                    continue
                
                seen_indices.add(idx)
                if vendor_id:
                    seen_vendor_ids.add(vendor_id)
                
                top.append({
                    "proposal": proposals[idx],
                    "reasoning": rank.get("reasoning", ""),
                    "scores": rank.get("scores", {})
                })
            
            if len(top) < n:
                for idx in range(len(proposals)):
                    if len(top) >= n:
                        break
                    if idx not in seen_indices:
                        vendor_id = proposals[idx].get('vendor_id')
                        if not vendor_id or vendor_id not in seen_vendor_ids:
                            top.append({
                                "proposal": proposals[idx],
                                "reasoning": f"Ranked #{len(top)+1} (added to fill top {n})",
                                "scores": {}
                            })
                            seen_indices.add(idx)
                            if vendor_id:
                                seen_vendor_ids.add(vendor_id)
            
            return top
        
        return {
            "best_price_top3": get_top_n(best_price_list, 3, "Best Price"),
            "best_warranty_top3": get_top_n(best_warranty_list, 3, "Best Warranty"),
            "best_delivery_top3": get_top_n(best_delivery_list, 3, "Best Delivery"),
            "best_quantity_top3": get_top_n(best_quantity_list, 3, "Best Quantity"),
            "overall_best_top3": get_top_n(overall_best_list, 3, "Overall Best"),
            "total_proposals_evaluated": len(proposals)
        }
    except Exception as e:
        print(f"Warning: AI evaluation failed, using fallback: {e}")
        import traceback
        traceback.print_exc()
        
        def get_price(proposal):
            extracted = proposal.get('extracted', {})
            total = extracted.get('total_price')
            if total is not None:
                try:
                    return float(total)
                except (ValueError, TypeError):
                    pass
            ppp = extracted.get('price_per_piece')
            if ppp is not None:
                try:
                    return float(ppp)
                except (ValueError, TypeError):
                    pass
            return float('inf')  
        
        sorted_by_price = sorted(proposals, key=get_price)[:min(3, len(proposals))]
        
        def create_fallback_top3(count=3):
            result = []
            for i in range(min(count, len(proposals))):
                result.append({
                    "proposal": proposals[i],
                    "reasoning": f"Rank {i+1} (fallback - AI evaluation failed)",
                    "scores": {}
                })
            return result
        
        return {
            "best_price_top3": [{"proposal": p, "reasoning": f"Rank {i+1} by price (fallback)", "scores": {}} for i, p in enumerate(sorted_by_price)],
            "best_warranty_top3": create_fallback_top3(),
            "best_delivery_top3": create_fallback_top3(),
            "best_quantity_top3": create_fallback_top3(),
            "overall_best_top3": [{"proposal": p, "reasoning": f"Rank {i+1} by price (fallback)", "scores": {}} for i, p in enumerate(sorted_by_price)],
            "total_proposals_evaluated": len(proposals)
        }
