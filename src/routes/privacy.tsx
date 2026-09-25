import * as stylex from '@stylexjs/stylex'
import { createFileRoute } from '@tanstack/react-router'
import { Anchor, Container, Text } from '@/components/ui'
import { space } from '@/styles/tokens.stylex'
import { publicPageHeaders } from '@/utils/cacheControl'

const CONTACT_EMAIL = 'robin@poggiolabs.com'
const LAST_UPDATED = 'September 13, 2026'

export const Route = createFileRoute('/privacy')({
  headers: publicPageHeaders,
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: 'Privacy policy' },
      {
        name: 'description',
        content: 'Privacy policy for Robinʼs Photos',
      },
    ],
  }),
})

const styles = stylex.create({
  page: { paddingTop: space.s4, paddingBottom: space.s4 },
  intro: { marginTop: space.s2 },
  section: { marginTop: space.s3 },
})

function PrivacyPage() {
  return (
    <Container maxWidth="md" xstyle={styles.page}>
      <Text variant="h4" as="h1" gutterBottom>
        Privacy policy
      </Text>
      <Text variant="body2" color="textSecondary" gutterBottom>
        Last updated {LAST_UPDATED}
      </Text>

      <Text variant="body1" paragraph xstyle={styles.intro}>
        Robinʼs Photos is a personal photo album site. Visitors can browse
        published albums without signing in, and no account is required to view
        anything on the site.
      </Text>

      <Text variant="h6" as="h2" gutterBottom xstyle={styles.section}>
        Visitors
      </Text>
      <Text variant="body1" paragraph>
        The site does not use advertising, tracking cookies, or third-party
        analytics. The hosting provider (Cloudflare) records standard server
        logs, such as IP address, browser type, and pages requested, for
        operating and securing the service. Images are served from Amazon S3,
        which records similar access logs.
      </Text>

      <Text variant="h6" as="h2" gutterBottom xstyle={styles.section}>
        Administrator sign-in with Google
      </Text>
      <Text variant="body1" paragraph>
        Only the site administrator signs in, using Google. When signing in, the
        site receives the Google account email address and uses it to confirm
        the person is the administrator. A session cookie keeps the
        administrator signed in.
      </Text>
      <Text variant="body1" paragraph>
        To import photos, the administrator grants the site access to the Google
        Photos Picker. This lets the site download only the photos the
        administrator explicitly selects in the Google Photos picker. The site
        never browses or accesses the rest of the Google Photos library. The
        Google access token is stored encrypted, is used solely to download the
        selected photos, and can be revoked at any time from the Google account
        permissions page.
      </Text>
      <Text variant="body1" paragraph>
        Photos imported this way, along with their metadata such as filename,
        capture date, and camera settings, are stored on Amazon S3 and in the
        siteʼs database so they can be published in albums on this site.
      </Text>
      <Text variant="body1" paragraph>
        The siteʼs use of information received from Google APIs adheres to the{' '}
        <Anchor
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noreferrer"
        >
          Google API Services User Data Policy
        </Anchor>
        , including the Limited Use requirements.
      </Text>

      <Text variant="h6" as="h2" gutterBottom xstyle={styles.section}>
        Sharing
      </Text>
      <Text variant="body1" paragraph>
        No personal information is sold or shared with third parties, other than
        the infrastructure providers named above that host the site.
      </Text>

      <Text variant="h6" as="h2" gutterBottom xstyle={styles.section}>
        Contact
      </Text>
      <Text variant="body1" paragraph>
        Questions about this policy can be sent to{' '}
        <Anchor href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Anchor>.
      </Text>
    </Container>
  )
}
