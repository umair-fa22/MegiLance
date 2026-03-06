// @AI-HINT: Redirects /legal/privacy to canonical /privacy route.
import { redirect } from 'next/navigation';

export default function LegalPrivacyPage() {
  redirect('/privacy');
}
