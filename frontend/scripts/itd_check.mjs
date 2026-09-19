/**
 * System: DPRMS
 * Purpose: Check the mechanically enforceable ITD frontend conventions.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import path from 'node:path';
import ts from 'typescript';
import { getSourceFiles } from './itd_format.mjs';

const DATA_PREFIX = /^(?:g_)?_?(?:byt|int|lng|flt|dbl|cur|chr|str|txt|dtm|dt|tm|bln|arr|obj|err|udt)[A-Z][a-zA-Z0-9]*$/;
const CONSTANT_NAME = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;
const FUNCTION_NAME = /^_?[a-z][a-zA-Z]*$/;
const REACT_ATTRIBUTE_NAMES = new Set(['children', 'key', 'ref', 'className', 'style', 'id', 'name', 'value', 'defaultValue', 'title', 'type', 'required', 'disabled', 'placeholder', 'autoFocus', 'tabIndex', 'role']);
const objConfig = ts.readConfigFile('tsconfig.app.json', ts.sys.readFile);
const objParsedConfig = ts.parseJsonConfigFileContent(objConfig.config, ts.sys, process.cwd());
const objProgram = ts.createProgram(objParsedConfig.fileNames, objParsedConfig.options);
const objChecker = objProgram.getTypeChecker();
const arrFailures = [];
let intFiles = 0;

/** Report an actionable source location for a convention violation. */
function _report(objSource, objNode, strMessage)
{
    const objPosition = objSource.getLineAndCharacterOfPosition(objNode.getStart());
    arrFailures.push(`${path.relative(process.cwd(), objSource.fileName)}:${objPosition.line + 1}: ${strMessage}`);
}

/** Determine whether a binding is a callback, hook, constructor, or component. */
function _isCallable(objNode)
{
    const objType = objChecker.getTypeAtLocation(objNode);
    const arrTypes = objType.isUnion() ? objType.types : [objType];
    return arrTypes.some((objPart) => objPart.getCallSignatures().length || objPart.getConstructSignatures().length);
}

/** Determine whether a declaration lives at module scope. */
function _isModuleBinding(objNode)
{
    for (let objParent = objNode.parent; objParent && !ts.isSourceFile(objParent); objParent = objParent.parent)
    {
        if (ts.isFunctionLike(objParent) || ts.isBlock(objParent))
        {
            return false;
        }
    }
    return true;
}

/** Validate a function's public spelling and its internal helper marker. */
function _checkFunction(objSource, objNode)
{
    const strName = objNode.name?.text;
    if (!strName)
    {
        return;
    }
    const blnIsComponent = /^[A-Z][a-zA-Z]*$/.test(strName);
    const blnIsHook = /^use[A-Z]/.test(strName);
    if (!blnIsComponent && !FUNCTION_NAME.test(strName))
    {
        _report(objSource, objNode, `Use alphabetic camelCase for function ${strName}.`);
    }
    const blnIsExported = Boolean(ts.getCombinedModifierFlags(objNode) & ts.ModifierFlags.Export);
    if (!blnIsComponent && !blnIsHook && !blnIsExported && !strName.startsWith('_'))
    {
        _report(objSource, objNode, `Prefix internal helper ${strName} with an underscore.`);
    }
    const arrComments = ts.getLeadingCommentRanges(objSource.text, objNode.pos) ?? [];
    if (!arrComments.some((objComment) => !objSource.text.slice(objComment.pos, objComment.end).includes('System: DPRMS')))
    {
        _report(objSource, objNode, `Describe ${strName} immediately above its declaration.`);
    }
}

/** Check syntax without imposing local naming rules on API fields or library contracts. */
function _checkNode(objSource, objNode)
{
    if ((ts.isVariableDeclaration(objNode) || ts.isParameter(objNode) || ts.isBindingElement(objNode)) && ts.isIdentifier(objNode.name))
    {
        const strName = objNode.name.text;
        const blnIsCallable = _isCallable(objNode.name);
        if (!blnIsCallable && !DATA_PREFIX.test(strName) && !CONSTANT_NAME.test(strName) && !/^[A-Z]/.test(strName))
        {
            _report(objSource, objNode, `Add an ITD data prefix to ${strName}.`);
        }
        if (!blnIsCallable && !CONSTANT_NAME.test(strName) && _isModuleBinding(objNode) && !strName.startsWith('g_'))
        {
            _report(objSource, objNode, `Add the g_ scope prefix to ${strName}.`);
        }
        if (/^(?:g_)?bln[A-Z]/.test(strName))
        {
            const objType = objChecker.getTypeAtLocation(objNode.name);
            const arrTypes = objType.isUnion() ? objType.types : [objType];
            const blnIsBoolean = arrTypes.every((objTypePart) => Boolean(objTypePart.flags & (ts.TypeFlags.BooleanLike | ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Any)));
            if (!blnIsBoolean)
            {
                _report(objSource, objNode, `The bln prefix requires a boolean value: ${strName}.`);
            }
        }
    }
    if (ts.isFunctionDeclaration(objNode))
    {
        _checkFunction(objSource, objNode);
    }
    if (ts.isPropertySignature(objNode) && ts.isIdentifier(objNode.name) && ts.isInterfaceDeclaration(objNode.parent) && /Props$/.test(objNode.parent.name.text))
    {
        const strName = objNode.name.text;
        if (!REACT_ATTRIBUTE_NAMES.has(strName) && !_isCallable(objNode) && !DATA_PREFIX.test(strName))
        {
            _report(objSource, objNode, `Add an ITD data prefix to custom prop ${strName}.`);
        }
    }
    if (ts.isIfStatement(objNode))
    {
        if (!ts.isBlock(objNode.thenStatement) || objNode.elseStatement && !ts.isBlock(objNode.elseStatement) && !ts.isIfStatement(objNode.elseStatement))
        {
            _report(objSource, objNode, 'Use braces for every conditional branch.');
        }
    }
    if (ts.isForStatement(objNode) || ts.isForOfStatement(objNode) || ts.isForInStatement(objNode) || ts.isWhileStatement(objNode) || ts.isDoStatement(objNode))
    {
        if (!ts.isBlock(objNode.statement))
        {
            _report(objSource, objNode, 'Use braces for every loop body.');
        }
    }
    if (ts.isForStatement(objNode) && objNode.initializer && ts.isVariableDeclarationList(objNode.initializer))
    {
        _report(objSource, objNode, 'Declare the counter immediately before the loop.');
    }
    if (ts.isSwitchStatement(objNode) && !objNode.caseBlock.clauses.some(ts.isDefaultClause))
    {
        _report(objSource, objNode, 'Include an explicit switch default.');
    }
    if (ts.isVariableStatement(objNode) && objNode.declarationList.declarations.length > 1)
    {
        _report(objSource, objNode, 'Use one declaration per statement.');
    }
    if (ts.isCatchClause(objNode))
    {
        if (!objNode.variableDeclaration || !/^err[A-Z]/.test(objNode.variableDeclaration.name.getText()))
        {
            _report(objSource, objNode, 'Name the caught error with an err prefix.');
        }
        if (!/reportError\(/.test(objNode.block.getText()))
        {
            _report(objSource, objNode, 'Report caught failures through the shared diagnostic helper.');
        }
    }
    if (ts.isAwaitExpression(objNode))
    {
        let blnIsCaught = false;
        for (let objParent = objNode.parent; objParent && !ts.isFunctionLike(objParent); objParent = objParent.parent)
        {
            if (ts.isBlock(objParent) && ts.isTryStatement(objParent.parent) && objParent.parent.tryBlock === objParent && objParent.parent.catchClause)
            {
                blnIsCaught = true;
                break;
            }
        }
        if (!blnIsCaught)
        {
            _report(objSource, objNode, 'Protect awaited operations with try/catch in the same function.');
        }
    }
    if (ts.isElementAccessExpression(objNode) && ts.isStringLiteral(objNode.argumentExpression) && !objNode.argumentExpression.getText().startsWith("'"))
    {
        _report(objSource, objNode, 'Use single quotes for literal record accessors.');
    }
    ts.forEachChild(objNode, (objChild) => _checkNode(objSource, objChild));
}

for (const strPath of getSourceFiles())
{
    const objSource = objProgram.getSourceFile(path.resolve(strPath));
    intFiles++;
    const strBaseName = path.basename(strPath);
    if (!/^(?:[a-z][a-z0-9_]*\.ts|[A-Z][a-zA-Z0-9]*\.tsx|(?:main|index)\.tsx)$/.test(strBaseName))
    {
        _report(objSource, objSource, 'Use snake_case utility names or PascalCase component filenames.');
    }
    if (!objSource.text.startsWith('/**\n * System: DPRMS\n * Purpose: ') || !objSource.text.includes(' * Programmer: ITD Development Team\n * Copyright: (c) 2026 ITD. All rights reserved.\n */'))
    {
        _report(objSource, objSource, 'Add the ITD program header with a specific purpose.');
    }
    _checkNode(objSource, objSource);
}

if (arrFailures.length)
{
    console.error(arrFailures.join('\n'));
    console.error(`${arrFailures.length} ITD convention violations in ${intFiles} files.`);
    process.exitCode = 1;
}
else
{
    console.log(`ITD conventions passed for ${intFiles} source files.`);
}
