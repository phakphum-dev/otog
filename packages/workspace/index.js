const fs = require('fs')
const glob = require('glob')
const YAML = require('yaml')

/**
 * The function checks if the path is a root workspace
 * @param {string} path - path to check if it is a root workspace
 */
function isRootWorkspace(path) {
  return fs.existsSync(`${path}/pnpm-workspace.yaml`)
}

/**
 * The function finds the root workspace
 * @param {string} path - path to start to find the root workspace
 * @returns
 */
function findRootWorkspace(path = process.cwd()) {
  // If the path has no parent, throw an error
  if (!path) throw new Error('No root workspace found')

  // If the path is root workspace, return it
  if (isRootWorkspace(path)) return path

  const parent = fs.realpathSync(path + '/..')
  return findRootWorkspace(parent)
}

/**
 * The function finds all package.json metadata in workspaces
 * @returns
 */
function findAllPackageMetadatas() {
  const rootWorkspace = findRootWorkspace()
  const pnpmWorkspace = YAML.parse(
    fs.readFileSync(`${rootWorkspace}/pnpm-workspace.yaml`, 'utf8')
  )

  const workspaces = pnpmWorkspace.packages

  // Find all package.json files in workspaces
  const pathToPackageJSONs = []
  for (const w of workspaces) {
    const paths = glob.sync(`${rootWorkspace}/${w}/package.json`)
    pathToPackageJSONs.push(...paths)
  }

  // Get all pacakge names
  const packageMetadatas = pathToPackageJSONs.map((p) => {
    const packageJson = JSON.parse(fs.readFileSync(p, 'utf8'))
    return {
      path: p,
      name: packageJson.name,
    }
  })

  return packageMetadatas
}

module.exports = {
  findAllPackageMetadatas: findAllPackageMetadatas,
}
