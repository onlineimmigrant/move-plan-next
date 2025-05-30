import { Button, Html, Head, Body, Container, Section, Text, Tailwind } from '@react-email/components';

interface WelcomeEmailProps {
  name: string;
}

export default function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="max-w-lg mx-auto my-8 p-6 bg-white rounded-lg">
            <Section>
              <Text className="text-2xl font-semibold text-gray-800">Welcome, {name}!</Text>
              <Text className="text-gray-600">Thank you for signing up. We're excited to have you!</Text>
              <Button
                href="https://your-app.com/dashboard"
                className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4"
              >
                Go to Dashboard
              </Button>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}