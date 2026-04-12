
export const GEN_AI_QUESTIONS = [
  // Phase 1: General Introduction (2 questions)
  "Could you please introduce yourself and walk us through your professional background and experience in software engineering?",
  "What specifically draws you to the field of Generative AI, and why are you interested in this role at our organization?",

  // Phase 2: Technical Deep Dive - Generative AI & LLMs (18 questions)
  "Can you explain the fundamental difference between Encoder-only, Decoder-only, and Encoder-Decoder architectures (like BERT, GPT, and T5)?",
  "How does the Attention mechanism—specifically Multi-Head Attention—work within a Transformer-based model?",
  "What are the common strategies for fine-tuning Large Language Models (LLMs)? Can you explain Parameter-Efficient Fine-Tuning (PEFT) methods like LoRA?",
  "Can you describe the end-to-end architecture and workflow of a Retrieval-Augmented Generation (RAG) system?",
  "How do you address 'hallucinations' in LLM outputs, and what validation or evaluation techniques do you use to ensure factual accuracy?",
  "What are Vector Databases, and how do they function within a GenAI application for high-dimensional similarity search?",
  "Explain the concept of 'Embeddings.' How do different embedding models impact the performance of a retrieval system?",
  "What is Prompt Engineering? Can you share some advanced techniques you've used, such as Chain-of-Thought or Few-Shot prompting?",
  "How do you optimize LLM inference for production? Tell us about techniques like Quantization (INT8/FP4) or KV-Caching.",
  "What are the ethical considerations and safety guardrails you implement when deploying a GenAI model to production?",
  "How do you handle context window limitations when processing extremely long documents or extended conversations?",
  "Can you explain the difference between a 'Base Model' and an 'Instruction-Tuned Model' (SFT)?",
  "What is Reinforcement Learning from Human Feedback (RLHF), and why is it crucial for aligning LLM behavior with human intent?",
  "How would you approach building a multi-modal application that integrates text and image generation capabilities?",
  "What are the primary challenges of scaling GenAI applications in a production environment with high user concurrency?",
  "How do you evaluate the quality of a GenAI system? What metrics or frameworks (e.g., RAGAS, LLM-as-a-judge) do you find most reliable?",
  "Can you describe how you would implement an efficient caching strategy for LLM responses to reduce both latency and API costs?",
  "If you were to build an autonomous AI Agent, what architectural patterns (e.g., ReAct, Tool-Calling) and frameworks would you choose?"
];

export const REACT_QUESTIONS = [
  // Phase 1: General Introduction (2 questions)
  "Could you please introduce yourself and walk us through your experience building user interfaces with React?",
  "What do you find most compelling about the React ecosystem, and why are you interested in this Frontend Engineer role?",

  // Phase 2: Technical Deep Dive - React & Frontend (18 questions)
  "What are the most significant features introduced in React 18, and how do they improve application performance?",
  "Can you explain how the React Reconciliation algorithm and the Virtual DOM work?",
  "What are the best practices for managing complex state in large React applications? When would you choose Context API over a library like Redux or Zustand?",
  "How do you optimize React component rendering? Tell us about useMemo, useCallback, and React.memo.",
  "What is your strategy for handling side effects in React? How do you ensure useEffect cleanup functions are properly implemented?",
  "Can you explain the concept of 'Concurrent Rendering' and how features like Transition API work?",
  "How do you approach Server-Side Rendering (SSR) vs. Static Site Generation (SSG) in a Next.js environment?",
  "What is the 'Hydration' process in React, and what common issues (like hydration mismatch) have you encountered?",
  "How do you ensure your React applications are accessible (A11y)? What tools or patterns do you use?",
  "What is your preferred approach to styling React components (e.g., Tailwind CSS, CSS Modules, or Styled Components) and why?",
  "How do you handle form validation and submission in React? Have you used libraries like React Hook Form or Formik?",
  "Describe your experience with React testing. What is the difference between shallow rendering and full DOM rendering in tools like Jest and React Testing Library?",
  "How do you implement Error Boundaries in React to prevent the entire app from crashing due to a component error?",
  "What are 'Higher-Order Components' (HOCs) and 'Render Props'? How do they compare to the Custom Hooks pattern?",
  "How do you approach API integration and data fetching? Tell us about using React Query (TanStack Query) or SWR.",
  "What are the security best practices you follow in React to prevent vulnerabilities like XSS or CSRF?",
  "How do you optimize the bundle size of a React application? Tell us about code-splitting and dynamic imports.",
  "Describe a time you had to debug a significant memory leak or performance bottleneck in a React application. How did you resolve it?"
];

export const JAVA_QUESTIONS = [
  // Phase 1: General Introduction (2 questions)
  "Could you please introduce yourself and walk us through your professional experience with Java and backend development?",
  "What motivates you to work with the Java ecosystem, and why are you interested in this Backend Engineer role at our company?",

  // Phase 2: Technical Deep Dive - Java & Backend (18 questions)
  "What are the key features introduced in recent Java versions (e.g., Java 17 or 21) that you find most impactful?",
  "Can you explain the JVM architecture? How does memory management (Heap vs. Stack) and Garbage Collection work?",
  "What are 'Virtual Threads' (Project Loom), and how do they change the way we handle high-concurrency Java applications?",
  "How does the Spring Boot 'Auto-configuration' work under the hood? Tell us about the @EnableAutoConfiguration annotation.",
  "Can you describe the Bean lifecycle in a Spring context?",
  "What are the best practices for building scalable Microservices using Spring Cloud or similar frameworks?",
  "How do you handle database persistence with Hibernate or JPA? Specifically, how do you solve the N+1 select problem?",
  "What is your approach to ensuring thread safety in a multi-threaded Java application? Tell us about the java.util.concurrent package.",
  "Can you explain common Design Patterns (e.g., Singleton, Strategy, Observer) and how you've applied them in Java?",
  "How do you implement security in a Java application? Describe your experience with Spring Security and JWT/OAuth2.",
  "What is your strategy for unit and integration testing in Java? Tell us about JUnit 5 and Mockito.",
  "How do you design and document RESTful APIs? Have you worked with Swagger/OpenAPI?",
  "How do you optimize SQL queries and database performance in a Java-based backend?",
  "What is your experience with message brokers like Kafka or RabbitMQ? How do you handle asynchronous communication between services?",
  "Describe your approach to CI/CD and containerization for Java applications using Docker and Kubernetes.",
  "What is the difference between a 'Checked Exception' and an 'Unchecked Exception' in Java, and when should each be used?",
  "How do you monitor and profile the performance of a Java application in production (e.g., using JMX, Prometheus, or Grafana)?",
  "Can you explain the internals of common Java Collections, such as how a HashMap handles collisions?"
];

export const ROLE_BASED_QUESTIONS: Record<string, string[]> = {
  "Generative AI Engineer": GEN_AI_QUESTIONS,
  "Gen AI Engineer": GEN_AI_QUESTIONS,
  "React Engineer": REACT_QUESTIONS,
  "Java Engineer": JAVA_QUESTIONS,
  "Software Engineer": GEN_AI_QUESTIONS, // Default to Gen AI if not specified
};

export const PREDEFINED_QUESTIONS = GEN_AI_QUESTIONS; 
export const FALLBACK_QUESTIONS = PREDEFINED_QUESTIONS;
