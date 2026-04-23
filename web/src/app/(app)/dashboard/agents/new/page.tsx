import AgentEditor from "@/components/dashboard/AgentEditor";

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
