import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to report immediately since that's the public face
  redirect('/public/report');
}
