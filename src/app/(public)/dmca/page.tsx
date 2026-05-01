import { LegalPage } from "@/components/public/legal-page";

export const metadata = {
  title: "DMCA | Fantasyia",
  description: "Politica de direitos autorais e notificacoes DMCA da Fantasyia.",
};

export default function DmcaPage() {
  return (
    <LegalPage
      title="DMCA Notice"
      updatedAt="21/04/2026"
      sections={[
        {
          heading: "Notificacao",
          body: "Titulares de direitos podem enviar notificacao formal com identificacao da obra, URL do conteudo questionado e declaracao de boa-fe.",
        },
        {
          heading: "Validacao",
          body: "A equipe analisa o pedido e pode remover ou restringir o conteudo de forma preventiva durante a investigacao.",
        },
        {
          heading: "Contra-notificacao",
          body: "Usuarios afetados podem apresentar contestacao com base legal e informacoes de contato, conforme exigencias do procedimento aplicavel.",
        },
        {
          heading: "Reincidencia",
          body: "Contas com reincidencia em violacoes de direitos autorais podem sofrer suspensao temporaria ou encerramento definitivo.",
        },
      ]}
    />
  );
}
