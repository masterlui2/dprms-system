/**
 * System: DPRMS
 * Purpose: Apply the shared TypeScript layout used by ITD frontend sources.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import fs from 'node:fs';
import path from 'node:path';
import prettier from 'prettier';
import ts from 'typescript';

export const FORMAT_OPTIONS = {
    indentSize: 4,
    tabSize: 4,
    newLineCharacter: '\n',
    convertTabsToSpaces: true,
    indentStyle: ts.IndentStyle.Smart,
    insertSpaceAfterCommaDelimiter: true,
    insertSpaceAfterSemicolonInForStatements: true,
    insertSpaceBeforeAndAfterBinaryOperators: true,
    insertSpaceAfterKeywordsInControlFlowStatements: true,
    insertSpaceAfterFunctionKeywordForAnonymousFunctions: true,
    insertSpaceBeforeFunctionParenthesis: false,
    insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: true,
    insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
    insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
    insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: false,
    placeOpenBraceOnNewLineForFunctions: true,
    placeOpenBraceOnNewLineForControlBlocks: true,
    semicolons: ts.SemicolonPreference.Insert,
};

/** Return project TypeScript files in a stable order. */
export function getSourceFiles(strDirectory = 'src')
{
    return fs.readdirSync(strDirectory, { withFileTypes: true })
        .flatMap((objEntry) =>
        {
            const strPath = path.join(strDirectory, objEntry.name);
            return objEntry.isDirectory() ? getSourceFiles(strPath) : /\.tsx?$/.test(strPath) ? [strPath] : [];
        })
        .sort();
}

/** Apply nonoverlapping edits from the end so earlier offsets remain valid. */
export function applyEdits(strText, arrEdits)
{
    for (const objEdit of [...arrEdits].sort((objLeft, objRight) => objRight.span.start - objLeft.span.start))
    {
        strText = strText.slice(0, objEdit.span.start) + objEdit.newText + strText.slice(objEdit.span.start + objEdit.span.length);
    }
    return strText;
}

/** Format with the installed compiler, including Allman control and function braces. */
export async function formatSource(strPath, strText)
{
    strText = await prettier.format(strText, {
        filepath: strPath,
        tabWidth: 4,
        useTabs: false,
        printWidth: 100,
        singleQuote: true,
        semi: true,
        trailingComma: 'all',
        endOfLine: 'lf',
    });
    const objHost = {
        getScriptFileNames: () => [strPath],
        getScriptVersion: () => '0',
        getScriptSnapshot: (strFile) => strFile === strPath ? ts.ScriptSnapshot.fromString(strText) : undefined,
        getCurrentDirectory: () => process.cwd(),
        getCompilationSettings: () => ({ jsx: ts.JsxEmit.ReactJSX }),
        getDefaultLibFileName: ts.getDefaultLibFilePath,
        fileExists: ts.sys.fileExists,
        readFile: ts.sys.readFile,
    };
    // Newly inserted line breaks need a second compiler pass to settle indentation.
    let intPass = 0;
    for (; intPass < 6; intPass++)
    {
        const objService = ts.createLanguageService(objHost);
        const strFormatted = applyEdits(strText, objService.getFormattingEditsForDocument(strPath, FORMAT_OPTIONS));
        objService.dispose();
        if (strText === strFormatted)
        {
            break;
        }
        strText = strFormatted;
    }
    return strText.trimEnd() + '\n';
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('scripts/itd_format.mjs'))
{
    const blnWrite = process.argv.includes('--write');
    let intFailures = 0;
    for (const strPath of getSourceFiles())
    {
        const strText = fs.readFileSync(strPath, 'utf8').replace(/\r\n/g, '\n');
        const strFormatted = await formatSource(strPath, strText);
        if (strText !== strFormatted)
        {
            if (blnWrite)
            {
                fs.writeFileSync(strPath, strFormatted);
            }
            else
            {
                console.error(`Layout differs: ${strPath}`);
                intFailures++;
            }
        }
    }
    process.exitCode = intFailures ? 1 : 0;
}
