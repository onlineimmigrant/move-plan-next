// emails/WelcomeEmail.tsx
import {
  Button,
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Tailwind,
  Link,
  Img,
  Hr,
} from '@react-email/components';

interface WelcomeEmailProps {
  name: string;
  domain: string;
  seo_og_image?: string;
  unsubscribeUrl: string;
  address: string;
}

export default function WelcomeEmail({ name, domain, seo_og_image, unsubscribeUrl, address }: WelcomeEmailProps) {
  const emailDomainRedirection = `https://${domain}/account`;
  const privacyPolicyUrl = `https://${domain}/privacy`;
  const supportEmail = `support@${domain}`;

  return (
    <Html>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Welcome to {domain}!</title>
      </Head>
      <Tailwind>
        <Body className="bg-[#F5F7FA] font-sans p-8">
          <Container className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            {/* Header with Logo */}
            <Section className="text-center mb-6">
              <Img
                src={seo_og_image || 'https://via.placeholder.com/150x50?text=Brand+Logo'}
                alt="Brand Logo"
                className="h-12 mx-auto"
              />
            </Section>

            {/* Welcome Message */}
            <Section className="text-center mb-6">
              <Text className="text-2xl font-bold text-[#1A202C]">Welcome, {name}!</Text>
              <Text className="text-base text-[#4A5568] mt-2">
                Thank you for joining our platform! We’re excited to have you on board. Get started by setting up
                your address and exploring our features.
              </Text>
            </Section>

            {/* Call to Action */}
            <Section className="text-center mb-6">
              <Button
                href={emailDomainRedirection}
                className="bg-sky-600 text-white px-6 py-2 rounded-md font-medium hover:bg-[#2D9F9B] transition-colors"
              >
                Set Up Your Account
              </Button>
            </Section>

            {/* Onboarding Steps */}
            <Section className="mb-6">
              <Text className="text-lg font-semibold text-[#1A202C] mb-4">Next Steps:</Text>
              <Text className="text-base text-[#4A5568]">
                <span className="ml-4">1.</span>{' '}
                <Link href={emailDomainRedirection} className="text-sky-600">
                  Complete your profile
                </Link>{' '}
                to personalize your experience.
                <br />
                <span className="ml-4">2.</span>{' '}
                <Link href={`https://${domain}/features`} className="text-sky-600">
                  Explore our features page
                </Link>{' '}
                to learn more.
                <br />
                <span className="ml-4">3.</span>{' '}
                <Link href={`mailto:${supportEmail}`} className="text-sky-600">
                  {supportEmail}
                </Link>{' '}
                if you need help.
              </Text>
            </Section>

            {/* Security Footer */}
            <Hr className="border-gray-100 my-1" />
            <Section className="text-center">
              <Text className="text-xs text-gray-400">
                You’re receiving this email because you signed up.<br />
                <Link href={unsubscribeUrl} className="text-gray-400 underline">Unsubscribe</Link> |{' '}
                <Link href={privacyPolicyUrl} className="text-gray-400 underline">Privacy Policy</Link> | Need help?<br />
                Contact us at{' '}
                <Link href={`mailto:${supportEmail}`} className="text-gray-400 underline">{supportEmail}</Link><br />
                <span className='text-gray-400'>{address}</span><br />
                <span className='text-gray-400'>© 2025 MetExam</span><br />
                <span className='text-gray-400'>All rights reserved.</span>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

// Plain-text version for better deliverability
export function WelcomeEmailPlainText({ name, domain, unsubscribeUrl, address }: WelcomeEmailProps) {
  const emailDomainRedirection = `https://${domain}/account`;
  const privacyPolicyUrl = `https://${domain}/privacy`;
  const supportEmail = `support@${domain}`;

  return `
Welcome, ${name}!

Thank you for joining our platform! We're excited to have you on board.
Get started by setting up your account: ${emailDomainRedirection}

Next Steps:
1. Complete your profile: ${emailDomainRedirection}
2. Explore our features: https://${domain}/features
3. Contact support: ${supportEmail}

---

You're receiving this email because you signed up at ${domain}.
Unsubscribe: ${unsubscribeUrl} | Privacy Policy: ${privacyPolicyUrl} | Need help?
Contact us: ${supportEmail}
Address: ${address}
© 2025 MetExam
All rights reserved.
  `.trim();
}