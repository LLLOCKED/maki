import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const generatedAndLocalFiles = {
  ignores: [
    '.next/**',
    'coverage/**',
    'node_modules/**',
    'public/**',
    'tmp/**',
    'tsconfig.tsbuildinfo',
    'next-env.d.ts',
    'components/footer.tsx.save',
  ],
}

const config = [
  generatedAndLocalFiles,
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      '@next/next/no-img-element': 'off',
    },
  },
]

export default config
