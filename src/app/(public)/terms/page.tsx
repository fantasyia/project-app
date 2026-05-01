import { LegalPage } from "@/components/public/legal-page";

export const metadata = {
  title: "Terms | Fantasyia",
  description: "Termos de uso da plataforma Fantasyia.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updatedAt="21/04/2026"
      sections={[
        {
          heading: "Uso da plataforma",
          body: "Ao acessar a Fantasyia, voce concorda em usar o servico para fins legais, respeitando regras de conduta, propriedade intelectual e politicas de conteudo.",
        },
        {
          heading: "Contas e acesso",
          body: "Voce e responsavel pela seguranca da sua conta e por toda atividade realizada nela. O acesso pode ser suspenso em casos de fraude, abuso ou violacao grave.",
        },
        {
          heading: "Pagamentos e assinaturas",
          body: "Assinaturas e compras avulsas (PPV) seguem o fluxo de pagamento exibido no checkout. Cobrancas e renovacoes sao apresentadas antes da confirmacao.",
        },
        {
          heading: "Limitacao de responsabilidade",
          body: "A plataforma e fornecida no estado atual, com esforco continuo de melhoria. Nao garantimos disponibilidade ininterrupta e podemos realizar manutencoes tecnicas quando necessario.",
        },
      ]}
    />
  );
}
