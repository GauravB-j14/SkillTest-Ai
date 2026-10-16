import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title:'SkillType AI — Learn by typing, master DSA by playing', description:'Learn anything while you type. Master DSA while you play.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
