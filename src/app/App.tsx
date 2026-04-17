import { RouterProvider } from 'react-router';
import { AuthProvider } from './providers/AuthProvider';
import { InepCatalogImportProvider } from './providers/InepCatalogImportProvider';
import { PlatformRegistryProvider } from './providers/PlatformRegistryProvider';
import { router } from './routes';

function App() {
  return (
    <AuthProvider>
      <InepCatalogImportProvider>
        <PlatformRegistryProvider>
          <RouterProvider router={router} />
        </PlatformRegistryProvider>
      </InepCatalogImportProvider>
    </AuthProvider>
  );
}

export default App;
