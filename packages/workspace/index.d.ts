interface PackageMetadata {
  name: string
  path: string
}

export function findAllPackageMetadatas(): PackageMetadata[]
