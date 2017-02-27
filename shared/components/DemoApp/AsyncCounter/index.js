import { createAsyncComponent } from 'react-async-component';

export default createAsyncComponent({
  resolve: () => System.import('./Counter'),
  ssrMode: 'boundary',
  name: 'AsyncCounter',
});
