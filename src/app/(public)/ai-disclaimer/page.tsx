import { LegalPage } from "@/components/public/legal-page";

export const metadata = {
  title: "AI Disclaimer | Fantasyia",
  description: "Aviso sobre uso de IA em conteudos e experiencias da Fantasyia.",
};

export default function AiDisclaimerPage() {
  return (
    <LegalPage
      title="AI Disclaimer"
      updatedAt="21/04/2026"
      sections={[
        {
          heading: "Conteudo assistido por IA",
          body: "Partes do conteudo, descricao de posts ou elementos editoriais podem usar assistencia de IA como apoio criativo e operacional.",
        },
        {
          heading: "Limites de precisao",
          body: "Respostas e textos gerados por IA podem conter imprecisoes. Para decisoes criticas, recomendamos validacao humana e fontes oficiais.",
        },
        {
          heading: "Responsabilidade",
          body: "Creators e usuarios continuam responsaveis pelo conteudo publicado, incluindo conformidade legal, direitos autorais e regras da comunidade.",
        },
        {
          heading: "Melhoria continua",
          body: "Modelos e prompts podem evoluir ao longo do tempo para aumentar qualidade, seguranca e consistencia da experiencia no app.",
        },
      ]}
    />
  );
}
