import * as fs from 'fs-extra';
import * as mime from 'mime-types';
import * as path from 'path';
import { DOC_DIR, TESTCASE_DIR } from 'src/core/constants';
import { FileManager } from 'src/core/fileManager';
import * as unzipper from 'unzipper';

export async function updateProblemDoc(
  problemName: string,
  pdfFullPath: string,
  fileManager: FileManager,
) {
  // create doc folder
  await fileManager.createDirIfNotExist(DOC_DIR);

  // remove old pdf file
  const uploadDocPath = path.join(DOC_DIR, `${problemName}.pdf`);
  await fileManager.removeDirIfExist(uploadDocPath);

  // get pdf file buffer
  const buffer = await fs.readFile(pdfFullPath);

  // save pdf file
  await fileManager.saveFile(uploadDocPath, buffer, {
    ContentType: 'application/pdf',
  });

  // remove pdf file
  await fs.remove(pdfFullPath);
}

export async function updateProblemTestCase(
  problemName: string,
  zipFullPath: string,
  fileManager: FileManager,
) {
  // create testcase folder
  await fileManager.createDirIfNotExist(TESTCASE_DIR);

  // clear old testcase
  const problemTestCaseDir = path.join(TESTCASE_DIR, problemName);
  await fileManager.removeDirIfExist(problemTestCaseDir);

  // create new testcase folder
  await fileManager.createDirIfNotExist(problemTestCaseDir);

  // unzip file
  const fileContents = fs.createReadStream(zipFullPath);
  await fileContents
    .pipe(unzipper.Parse())
    .on('entry', async (entry) => {
      const fileName = entry.path;
      const type = entry.type;
      if (type === 'Directory') {
        entry.autodrain();
      } else {
        const dest = path.join(problemTestCaseDir, fileName);
        const buffer = await entry.buffer();
        const ext = path.extname(fileName);
        const contentType = ['.in', '.sol'].includes(ext)
          ? 'text/plain'
          : mime.lookup(ext);
        await fileManager.saveFile(dest, buffer, {
          ContentType: contentType || undefined,
        });
      }
    })
    .promise();

  // remove zip file
  await fs.remove(zipFullPath);
}

export async function removeProblemSource(
  problemName: string,
  fileManager: FileManager,
) {
  const docPath = path.join(DOC_DIR, `${problemName}.pdf`);
  const testCasePath = path.join(TESTCASE_DIR, problemName);

  await fileManager.removeDirIfExist(docPath);
  await fileManager.removeDirIfExist(testCasePath);
}

export async function getProblemDocStream(
  problemName: string,
  fileManager: FileManager,
) {
  const docDir = path.join(DOC_DIR, `${problemName}.pdf`);
  if (!(await fileManager.isExists(docDir))) return null;
  return await fileManager.getFileReadSteam(docDir);
}
