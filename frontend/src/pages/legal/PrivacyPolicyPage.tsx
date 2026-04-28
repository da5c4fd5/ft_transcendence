import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-preact';

export function PrivacyPolicyPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-verylightorange px-4 py-10">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.length > 1 ? window.history.back() : navigate('/')}
            className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow shrink-0"
          >
            <ArrowLeft size={16} className="text-darkgrey" />
          </button>
          <div>
            <p className="text-xs font-bold text-mediumgrey uppercase tracking-widest">Legal</p>
            <h1 className="text-2xl font-black text-darkgrey">Privacy Policy</h1>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-7 shadow-sm flex flex-col gap-6 text-sm text-darkgrey leading-relaxed">

          <p className="text-mediumgrey text-xs font-medium">Last updated: April 28, 2025</p>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-black text-darkgrey">1. Introduction</h2>
            <p>
              Capsul ("we", "our", or "us") is a personal memory journaling application. This Privacy Policy explains
              how we collect, use, store, and protect your personal data when you use our service at{' '}
              <span className="font-semibold">transcen.dence.fr</span>.
            </p>
            <p>
              By creating an account and using Capsul, you agree to the collection and use of information in
              accordance with this policy. We are committed to protecting your privacy and handling your data
              with transparency and care.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-black text-darkgrey">2. Data We Collect</h2>
            <p><strong>Account information:</strong> When you register, we collect your username, email address, and a securely hashed version of your password. We never store your password in plain text.</p>
            <p><strong>Memory content:</strong> All memories you create — including text, dates, mood entries, and any media files (photos) you upload — are stored and associated with your account.</p>
            <p><strong>Social data:</strong> Friend relationships, friend requests, and direct messages sent between users are stored to provide the social features of the application.</p>
            <p><strong>Session data:</strong> We store session tokens and your device's user-agent string to manage authenticated sessions. You can review and revoke active sessions at any time from your profile.</p>
            <p><strong>Usage data:</strong> We may collect basic technical information such as IP addresses and access timestamps for security and abuse prevention purposes.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-black text-darkgrey">3. How We Use Your Data</h2>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>To create and manage your account and authenticate your identity.</li>
              <li>To display your memories, timeline, and tree progress within the application.</li>
              <li>To enable social features such as friend connections, messaging, and memory sharing.</li>
              <li>To send transactional emails (email verification, reminders, export confirmations) when you explicitly request them.</li>
              <li>To detect and prevent fraudulent or abusive activity.</li>
            </ul>
            <p>We do not use your data for advertising, profiling, or any purpose beyond operating the Capsul service.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-black text-darkgrey">4. Data Sharing</h2>
            <p>
              We do not sell, rent, or share your personal data with third parties for commercial purposes.
            </p>
            <p>
              <strong>Email delivery:</strong> We use a transactional email provider solely to deliver emails
              you have requested (e.g., verification codes, reminder emails). This provider receives your email
              address and the content of the email only.
            </p>
            <p>
              <strong>Legal obligations:</strong> We may disclose information if required by applicable law
              or in response to a valid legal process.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-black text-darkgrey">5. Data Retention</h2>
            <p>
              Your data is retained for as long as your account is active. When you delete your account,
              all associated data — including memories, media, messages, friend relationships, and sessions —
              is permanently and irreversibly deleted from our systems.
            </p>
            <p>
              You will receive a confirmation email upon account deletion as a permanent record of the action.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-black text-darkgrey">6. Your Rights (GDPR)</h2>
            <p>If you are located in the European Union, you have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li><strong>Right of access:</strong> You can view all your data directly within the application.</li>
              <li><strong>Right to rectification:</strong> You can update your username, email, and other profile information at any time from your profile settings.</li>
              <li><strong>Right to erasure:</strong> You can permanently delete your account and all associated data from the "Account" section of your profile.</li>
              <li><strong>Right to data portability:</strong> You can export all your personal data as a JSON file from the "Account" section of your profile.</li>
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-black text-darkgrey">7. Security</h2>
            <p>
              We take the security of your data seriously. Passwords are hashed using Argon2id, a memory-hard
              hashing algorithm. All data is transmitted over HTTPS. Sessions use secure, HTTP-only cookies.
              Multi-factor authentication (TOTP) is available as an additional layer of protection.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-black text-darkgrey">8. Cookies</h2>
            <p>
              Capsul uses a single session cookie to keep you authenticated. This cookie is HTTP-only,
              Secure, and SameSite=Strict. We do not use tracking cookies, analytics cookies, or
              third-party cookies of any kind.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-black text-darkgrey">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will update the
              "Last updated" date at the top of this page. Continued use of Capsul after changes
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-black text-darkgrey">10. Contact</h2>
            <p>
              If you have questions about this Privacy Policy or wish to exercise your rights, please
              contact us through the application or at the domain listed above.
            </p>
          </section>

        </div>

        <p className="text-center text-xs text-mediumgrey pb-4">
          © 2025 Capsul · <button onClick={() => navigate('/terms')} className="hover:text-darkgrey underline">Terms of Service</button>
        </p>
      </div>
    </div>
  );
}
