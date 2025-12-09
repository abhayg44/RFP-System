## EVALUATION PROCESS FLOW

frontend(ProposalPage.js)->Node(/api/vendors/proposals/:rfpId)->Shows AI evaluation

backend->proposals_evaluation_queue(Rabbitmq)->aiEvaluationHandler() and updates the DB

Python->(consume from)proposals_evaluation_queue->ai_service.py->evaluate_proposals->ollama server->back to evaluation_results_queue(rabbitmq)->evaluationListner(node)->store in mongoDB


## EMAIL SERVICE and CLIENT REQUEST

frontend->node.js->ai_request_queue(rabbitmq)->python->ollama->strucutred data back to ->ai_responses_queue(rabbitmq)->node.js->db save->sendEmailAsync(to vendor)

## VENDOR REQUEST

direct node API->ai_request_queue(rabbitmq)->python->ollama->strucutred data back to ->ai_responses_queue(rabbitmq)->node.js->db save->sendEmailAsync(to client)






