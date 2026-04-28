import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-preact';

export function TermsOfServicePage() {
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
            <h1 className="text-2xl font-black text-darkgrey">Terms of Service</h1>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-7 shadow-sm flex flex-col gap-6 text-sm text-darkgrey leading-relaxed">

          <p className="text-mediumgrey text-xs font-medium">Last updated: April 28, 2025</p>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-black text-darkgrey">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Capsul ("the Service"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Service.
            </p>
            <p>
              Capsul is a personal memory journaling application that allows users to capture, preserve,
              and share daily moments over time.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-black text-darkgrey">2. Account Registration</h2>
            <p>
              To use Capsul, you must create an account with a valid email address, a unique username,
              and a secure password. You are responsible for:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>Maintaining the confidentiality of your account credentials.</li>
              <li>All activity that occurs under your account.</li>
              <li>Notifying us immediately of any unauthorized access to your account.</li>
            </ul>
            <p>
              You must be at least 13 years old to create an account. By registering, you confirm
              that you meet this age requirement.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-black text-darkgrey">3. Acceptable Use</h2>
            <p>You agree not to use Capsul to:</p>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>Upload, post, or share content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable.</li>
              <li>Violate the privacy or intellectual property rights of others.</li>
              <li>Attempt to gain unauthorized access to the Service, other accounts, or our infrastructure.</li>
              <li>Engage in any activity that disrupts or interferes with the Service or the experience of other users.</li>
              <li>Use automated tools to scrape, extract, or bulk-download data from the Service.</li>
            </ul>
            <p>We reserve the right to suspend or terminate accounts that violate these conditions.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-black text-darkgrey">4. Your Content</h2>
            <p>
              You retain full ownership of all content you create on Capsul — including memories, text,
              photos, and any other material you upload ("Your Content").
            </p>
            <p>
              By using the Service, you grant Capsul a limited, non-exclusive, royalty-free license to
              store, display, and process Your Content solely for the purpose of providing the Service to you.
              We do not claim ownership of your memories.
            </p>
            <p>
              You are solely responsible for ensuring that Your Content does not infringe on the rights
              of third parties, including copyright, trademark, or privacy rights.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-black text-darkgrey">5. Shared Memories</h2>
            <p>
              Capsul allows you to share individual memories with others via a unique link or with
              your friend network. When you mark a memory as public or share it, you acknowledge
              that the content will be visible to the intended recipients.
            </p>
            <p>
              You can revoke sharing at any time by making the memory private again from your settings.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-black text-darkgrey">6. Privacy</h2>
            <p>
              Your use of Capsul is also governed by our{' '}
              <button onClick={() => navigate('/privacy')} className="font-semibold underline hover:text-mediumgrey">
                Privacy Policy
              </button>
              , which is incorporated into these Terms by reference. Please review it to understand
              how we collect, use, and protect your data.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-black text-darkgrey">7. Service Availability</h2>
            <p>
              We aim to provide a reliable and continuous service but cannot guarantee uninterrupted
              availability. The Service may be temporarily unavailable due to maintenance, updates,
              or circumstances beyond our control.
            </p>
            <p>
              We reserve the right to modify, suspend, or discontinue the Service at any time,
              with or without notice.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-black text-darkgrey">8. Account Termination</h2>
            <p>
              You may delete your account at any time from the "Account" section of your profile.
              Upon deletion, all your data will be permanently removed from our systems.
            </p>
            <p>
              We reserve the right to suspend or terminate your account without notice if you
              violate these Terms or engage in conduct that we determine, in our sole discretion,
              to be harmful to the Service or other users.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-black text-darkgrey">9. Intellectual Property</h2>
            <p>
              The Capsul name, logo, design, and codebase are the intellectual property of the
              Capsul team. Nothing in these Terms grants you a right to use our trademarks,
              branding, or proprietary technology beyond what is necessary to use the Service.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-black text-darkgrey">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, Capsul and its creators shall not
              be liable for any indirect, incidental, special, consequential, or punitive damages
              arising from your use of or inability to use the Service.
            </p>
            <p>
              The Service is provided "as is" and "as available" without warranties of any kind,
              either express or implied.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-black text-darkgrey">11. Changes to Terms</h2>
            <p>
              We reserve the right to update these Terms at any time. When we do, the "Last updated"
              date at the top of this page will be revised. Your continued use of Capsul after
              changes are posted constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-black text-darkgrey">12. Contact</h2>
            <p>
              If you have questions about these Terms, please contact us through the application
              or via the domain listed in our Privacy Policy.
            </p>
          </section>

        </div>

        <p className="text-center text-xs text-mediumgrey pb-4">
          © 2025 Capsul · <button onClick={() => navigate('/privacy')} className="hover:text-darkgrey underline">Privacy Policy</button>
        </p>
      </div>
    </div>
  );
}
