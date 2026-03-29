try:
    from app.services.llm_gateway import llm_gateway
    print("Loaded llm_gateway")
    
    from app.services.advanced_ai import AdvancedAIService
    print("Loaded advanced_ai")
    
    from app.services.ai_writing import AIWritingService
    print("Loaded ai_writing")
    
    from app.services.fraud_detection import FraudDetectionService
    print("Loaded fraud_detection")
    
    from app.services.ai_chatbot import AIChatbotService
    print("Loaded ai_chatbot")
    
    from app.services.skill_analyzer_engine import analyze_skills
    print("Loaded skill_analyzer_engine")
    
    from app.services.proposal_writer_engine import generate_proposal
    print("Loaded proposal_writer_engine")
    
    from app.api.v1.core_domain.proposal_writer import generate_proposal as ep
    print("Loaded route core_domain/proposal_writer")

    print("\\nSUCCESS: ALL MODULES LOADED")
except Exception as e:
    print("\\nERROR LOADING MODULES:")
    import traceback
    traceback.print_exc()
