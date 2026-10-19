import { LegalDocument } from '@/components/legal-document';
export const metadata={title:'Termos de uso | AMF'};
export const dynamic='force-dynamic';
export default function Terms(){return <LegalDocument kind="terms" />;}
