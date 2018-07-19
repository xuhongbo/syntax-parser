import { IToken } from '../lexer/interface';
import tokenTypes from '../lexer/token-types';
import { chainLine, chainLineTry, IChain } from './chain';
import { Scanner } from './scanner';

export type IMatch = boolean;

function equalWordOrIncludeWords(str: string, word: string | string[]) {
  if (typeof word === 'string') {
    return str.toLowerCase() === word.toLowerCase();
  } else {
    return word.some(eachWord => eachWord.toLowerCase() === str.toLowerCase());
  }
}

function isTypeReserved(token: IToken) {
  return (
    token.type === tokenTypes.RESERVED ||
    token.type === tokenTypes.RESERVED_NEWLINE ||
    token.type === tokenTypes.RESERVED_TOPLEVEL
  );
}

function matchToken(scanner: Scanner, compare: (token: IToken) => boolean): IMatch {
  const token = scanner.read();
  if (!token) {
    return false;
  }
  if (compare(token)) {
    scanner.next();
    return true;
  } else {
    return false;
  }
}

function createMatch<T>(fn: (scanner: Scanner, arg?: T) => IMatch) {
  return (scanner: Scanner, arg?: T) => {
    function foo() {
      return fn(scanner, arg);
    }
    foo.prototype.name = 'match';
    return foo;
  };
}

export const matchWord = createMatch((scanner, word?: string | string[]) => {
  if (!word) {
    return matchToken(scanner, token => token.type === tokenTypes.WORD);
  } else {
    return matchToken(scanner, token => token.type === tokenTypes.WORD && equalWordOrIncludeWords(token.value, word));
  }
});

export const match = createMatch((scanner, word: string | string[]) =>
  matchToken(scanner, token => equalWordOrIncludeWords(token.value, word))
);

export const matchString = createMatch(scanner => matchToken(scanner, token => token.type === tokenTypes.STRING));

export const matchNumber = createMatch(scanner => matchToken(scanner, token => token.type === tokenTypes.NUMBER));

export const matchWordOrString = createMatch(scanner =>
  matchToken(scanner, token => token.type === tokenTypes.WORD || token.type === tokenTypes.STRING)
);

export const matchWordOrStringOrNumber = createMatch(scanner =>
  matchToken(
    scanner,
    token => token.type === tokenTypes.WORD || token.type === tokenTypes.STRING || token.type === tokenTypes.NUMBER
  )
);

export const matchAll = () => {
  function foo() {
    return true;
  }
  foo.prototype.name = 'match';
  return foo;
};

export const matchPlus = (scanner: Scanner, fn: () => IChain) => {
  return (): IChain => chainLine(fn, chainLineTry(matchPlus(scanner, fn)));
};
