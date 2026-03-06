// @AI-HINT: Redirects /legal/terms to canonical /terms route.
import { redirect } from 'next/navigation';

export default function LegalTermsPage() {
  redirect('/terms');
}
