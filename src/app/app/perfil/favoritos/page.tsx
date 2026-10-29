import { redirect } from 'next/navigation';

// Favoritos ainda não existe no app; o endereço antigo volta para o perfil.
export default function FavoritesPage() {
  redirect('/app/perfil');
}
