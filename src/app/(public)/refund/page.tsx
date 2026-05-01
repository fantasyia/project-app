import { LegalPage } from "@/components/public/legal-page";

export const metadata = {
  title: "Refund | Fantasyia",
  description: "Politica de reembolso da plataforma Fantasyia.",
};

export default function RefundPage() {
  return (
    <LegalPage
      title="Refund Policy"
      updatedAt="21/04/2026"
      sections={[
        {
          heading: "Escopo",
          body: "Pedidos de reembolso sao avaliados com base em falhas tecnicas comprovadas, cobranca indevida ou erro operacional identificado na transacao.",
        },
        {
          heading: "Prazos",
          body: "A solicitacao deve ser enviada em prazo razoavel apos a cobranca, contendo identificador da compra e descricao objetiva do problema.",
        },
        {
          heading: "Analise",
          body: "Cada caso passa por revisao interna de risco e pagamento. Compras com consumo integral de conteudo podem ter elegibilidade reduzida conforme politica.",
        },
        {
          heading: "Conclusao",
          body: "Quando aprovado, o reembolso segue para o provedor de pagamento e o prazo final de estorno depende do metodo utilizado pelo usuario.",
        },
      ]}
    />
  );
}
