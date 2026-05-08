import os
import sys
import asyncio
from unittest.mock import MagicMock

# Add the controllers directory to path
sys.path.append(os.path.join(os.getcwd(), 'controllers'))
from nlp_analysis import LocalNLPAnalysisController

async def test_local_nlp():
    print("Testing Local NLP Analysis Controller...")
    controller = LocalNLPAnalysisController()
    
    # Test 1: Policy-like text
    policy_text = """
    Customer Refund Policy
    This policy outlines the terms and conditions for refunds for our customer support services.
    Our organization is dedicated to providing high quality service.
    If you are not satisfied, you may request a refund within 30 days.
    However, we are not responsible for any indirect damages.
    Refunds are at our discretion and may take some time to process.
    """
    
    print("\n--- Testing Policy Text ---")
    verif = controller.verify_policy_content(policy_text)
    print(f"Category: {verif['category']} (Score: {verif['category_score']})")
    print(f"Is Valid Policy: {verif['is_valid']}")
    
    ambiguities = controller.detect_ambiguities(policy_text)
    print(f"Ambiguities Found: {len(ambiguities)}")
    for a in ambiguities:
        print(f" - {a['issue']}: {a['suggestion']}")
    
    # Test 2: Academic-like text
    academic_text = """
    Abstract: This research paper investigates the methodology of quantum computing.
    Keywords: Quantum, Physics, Computing
    Introduction: In this journal article, the authors explore the references and citations related to entanglement.
    Table 1 shows the experimental results.
    Conclusion: The findings suggest that the methodology is sound.
    References:
    1. Doe, J. (2025). Physics Journal.
    """
    
    print("\n--- Testing Academic Text ---")
    verif_acad = controller.verify_policy_content(academic_text)
    print(f"Category: {verif_acad['category']} (Score: {verif_acad['category_score']})")
    print(f"Is Valid Policy: {verif_acad['is_valid']}")
    
    if not verif_acad['is_valid']:
        print("SUCCESS: Identified academic text and rejected it.")
    else:
        print("FAILURE: Academic text was accepted as a policy.")

if __name__ == "__main__":
    asyncio.run(test_local_nlp())
