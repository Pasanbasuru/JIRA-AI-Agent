# 🧠 AI JIRA Automation Agent

This project is an MVP implementation of an AI-powered automation agent that processes JIRA tickets, plans actions using LLMs, and performs tasks like code generation, Git operations, and JIRA status updates.

---

## 🚀 Features

- ✅ Natural language understanding of JIRA tickets
- 🧠 LLM-powered planning (GPT-4 + DeepSeek-R1-Distill-Llama-70B-free)
- 🧪 Automated code generation
- 📦 Git automation: branch, commit, PR
- 🖼️ Design research with AI-generated diagrams
- 📌 JIRA integration: transitions, comments, images

---

## 📁 Project Structure

```
├── agent.js                # Agent orchestrator
├── index.js                # Entry point for Lambda or CLI
├── tools.js                # Tool registry
├── tool-impl/              # All executable tools
├── prompt-templates/       # LangChain prompt logic
├── images/                 # Temporary image outputs
├── .env                    # Environment config
```

---

## ⚙️ Deployment Guide

### 🔗 Trigger

Configure a **JIRA Webhook** to POST ticket data (key, summary, description) to your AWS API Gateway endpoint when stories are updated.

### 🛠 AWS Lambda + API Gateway

1. Zip the repo (excluding `node_modules`)
2. Upload to AWS Lambda
3. Set required environment variables (`OPENAI_API_KEY`, `JIRA_EMAIL`, etc.)
4. Link to API Gateway for HTTP trigger

---

## 📈 Scaling Recommendations

### Containerized Execution

- Migrate to ECS or EKS
- Use SQS/Kafka for queued ticket ingestion
- Run multiple agent containers in parallel

### Benefits:
- Handles high ticket throughput
- Greater observability & retry control

---

## 🔮 Future Enhancements

- 🧠 **RAG (Retrieval-Augmented Generation)** using internal docs
- 🔧 CI/CD pipeline validation
- 🧩 Plugin architecture for custom team tools
- 🤖 Developer assistant agent
- 📊 Analytics and dashboards

---

## 🔗 Useful Links

- ProjectA GitHub: [https://github.com/Pasanbasuru/project-A](https://github.com/Pasanbasuru/project-A)
- ProjectA Demo: [https://project-a-ai.netlify.app](https://project-a-ai.netlify.app)

---

## 📚 Resources

- LangChain: https://docs.langchain.com/
- OpenAI: https://platform.openai.com/
- Pinecone: https://www.pinecone.io/
- JIRA API: https://developer.atlassian.com/cloud/jira/platform/rest/v3/
- GitHub API: https://docs.github.com/en/rest

---

