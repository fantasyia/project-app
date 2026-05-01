import { LegalPage } from "@/components/public/legal-page";

export const metadata = {
  title: "Privacy | Fantasyia",
  description: "Politica de privacidade da plataforma Fantasyia.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updatedAt="21/04/2026"
      sections={[
        {
          heading: "Dados coletados",
          body: "Coletamos dados de cadastro, uso da plataforma, transacoes e seguranca para operar recursos como feed, mensagens, assinaturas e suporte.",
        },
        {
          heading: "Finalidade",
          body: "Os dados sao usados para autenticacao, personalizacao da experiencia, processamento de pagamentos, prevencao de fraude e cumprimento de obrigacoes legais.",
        },
        {
          heading: "Compartilhamento",
          body: "Compartilhamos dados com provedores de infraestrutura e pagamento estritamente para viabilizar o servico, sempre com controles de seguranca e minimizacao.",
        },
        {
          heading: "Direitos do titular",
          body: "Voce pode solicitar acesso, correcao e exclusao de dados, observando requisitos legais, obrigacoes fiscais e regras de retencao aplicaveis.",
        },
      ]}
    />
  );
}
