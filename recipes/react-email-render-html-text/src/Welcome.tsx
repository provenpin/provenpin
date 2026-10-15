import { Html, Head, Preview, Body, Container, Heading, Text, Button, Hr, Link, Section, Row, Column } from "@react-email/components";
import { render } from "@react-email/render";

export type WelcomeProps = { name: string; course: string; startDate: string; url: string; items: { label: string; hours: number }[] };

export function WelcomeEmail({ name, course, startDate, url, items }: WelcomeProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{`You're enrolled in ${course}`}</Preview>
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f4f4f4" }}>
        <Container style={{ padding: "24px", backgroundColor: "#ffffff" }}>
          <Heading as="h1">Welcome, {name}!</Heading>
          <Text>
            Your class <strong>{course}</strong> starts {startDate}.
          </Text>
          <Section>
            {items.map((i) => (
              <Row key={i.label}>
                <Column>{i.label}</Column>
                <Column align="right">{i.hours} h</Column>
              </Row>
            ))}
          </Section>
          <Button href={url} style={{ backgroundColor: "#0b3d91", color: "#ffffff", padding: "12px 20px" }}>
            View schedule
          </Button>
          <Hr />
          <Text style={{ fontSize: "12px" }}>
            Questions? <Link href="mailto:info@example.com">info@example.com</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderWelcome(props: WelcomeProps) {
  const el = <WelcomeEmail {...props} />;
  const [html, text] = await Promise.all([render(el), render(el, { plainText: true })]);
  return { html, text };
}
