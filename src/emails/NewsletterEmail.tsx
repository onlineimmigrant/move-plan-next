import { Button, Html, Head, Body, Container, Section, Text, Tailwind } from '@react-email/components';

interface NewsletterEmailProps {
  title: string;
  content: string;
}

export default function NewsletterEmail({ title, content }: NewsletterEmailProps) {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="max-w-lg mx-auto my-8 p-6 bg-white rounded-lg">
            <Section>
              <Text className="text-2xl font-semibold text-gray-800">{title}</Text>
              <Text className="text-gray-600">{content}</Text>
              <Button
                href="https://metexam.co.uk/offers"
                className="bg-teal-500 text-white px-4 py-2 rounded-md mt-4"
              >
                Check Out Our Latest Offers
              </Button>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}