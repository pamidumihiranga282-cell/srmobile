import { Card, Container, Divider } from "@/components/ui";
import { aboutUs, privacyPolicy, refundPolicy, termsConditions } from "@/content/policies";
import type { SiteSettings } from "@/lib/types";

export function PolicyPage(props: { kind: "about" | "privacy" | "refund" | "terms"; settings: SiteSettings }) {
  const data =
    props.kind === "about"
      ? { ...aboutUs, body: props.settings.aboutText?.trim() ? props.settings.aboutText : aboutUs.body }
      : props.kind === "privacy"
        ? privacyPolicy
        : props.kind === "refund"
          ? refundPolicy
          : termsConditions;

  return (
    <div>
      <Container>
        <div className="mt-6 text-xs text-white/50">Home / {data.title}</div>
        <Card className="mt-4 p-4 sm:p-6">
          <div className="font-[Poppins] text-xl font-bold text-white">{data.title}</div>
          <Divider className="my-4" />
          <div className="whitespace-pre-wrap text-sm text-white/75">{data.body}</div>
        </Card>
      </Container>
    </div>
  );
}
