import sys
import os

# Add the parent directory to sys.path to import controller
sys.path.append(os.getcwd())

from controllers.nlp_analysis import LocalNLPAnalysisController

def test_nlp():
    controller = LocalNLPAnalysisController()
    
    # 1. Test Cleaning
    messy_text = "This  is a   messy   sentence with  pol- icy  breaks and \x00 non-printable characters."
    cleaned = controller.clean_text(messy_text)
    print(f"CLEANED TEXT: '{cleaned}'")
    
    # 2. Test Policy Verification
    valid_text = "This is our Refund Policy. Please read our terms and conditions and privacy agreement for the organization."
    invalid_text = "This is a story about a dragon who lived in a cave and ate apples every day."
    
    valid_result = controller.verify_policy_content(valid_text)
    invalid_result = controller.verify_policy_content(invalid_text)
    
    print(f"VALID POLICY CHECK: {valid_result['is_valid']} (Score: {valid_result['score']})")
    print(f"INVALID POLICY CHECK: {invalid_result['is_valid']} (Score: {invalid_result['score']})")
    
    # 3. Test Ambiguity Detection
    long_text = "This is a very long sentence that goes on and on for quite a while without any punctuation to break it up and probably exceeds forty words which makes it very hard for a small local AI model to process correctly in a RAG system." * 3
    ambiguities = controller.detect_ambiguities(long_text)
    print(f"AMBIGUITIES FOUND: {len(ambiguities)}")
    for a in ambiguities:
        print(f" - ISSUE: {a['issue']}")
        print(f" - SUGGESTION: {a['suggestion']}")

if __name__ == "__main__":
    test_nlp()
