import AgentEditor from "@/frontend/components/dashboard/AgentEditor";

export default function NewAgentPage() {
  return (
    <AgentEditor
      agent={{
        name: "",
        tone: "PROFESSIONAL",
        industry: "",
        status: "DRAFT",
        systemPrompt: "",
        knowledgeBase: "",
      }}
    />
  );
}
