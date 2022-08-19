import { eSupportedInterfaces, ICoinMetadata } from '../types';
import { configAws } from '.';
import * as erc20Abi from './ABI/erc20.json';
import * as erc20GreenAbi from './ABI/erc20-green.json';
import * as erc1155Abi from './ABI/erc1155.json';

import {
  BtcWallet,
  EthWallet,
  DocWallet,
  Erc20Wallet,
  Erc1155Wallet,
} from '../wallet-api/coin-wallets';

class WalletConfig {
  // Ethereum Chain IDs:
  //      1 - Mainnet
  //      3 - Ropsten
  //   1337 - Local
  private ethChainIDs: number[];

  constructor(){
    this.ethChainIDs = [1, 3, 1337];
  }

  public getWalletConfigurations = (): ICoinMetadata[]  => {
    const { contractAddresses, chainId } = configAws;
    const result: ICoinMetadata[] = [
      {
        name: 'Bitcoin',
        backgroundColor: '#FB9A00',
        icon:
          'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZlcnNpb249IjEuMSIgc2hhcGUtcmVuZGVyaW5nPSJnZW9tZXRyaWNQcmVjaXNpb24iIHRleHQtcmVuZGVyaW5nPSJnZW9tZXRyaWNQcmVjaXNpb24iIGltYWdlLXJlbmRlcmluZz0ib3B0aW1pemVRdWFsaXR5IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgdmlld0JveD0iMCAwIDQwOTEuMjcgNDA5MS43MyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbG5zOnhvZG09Imh0dHA6Ly93d3cuY29yZWwuY29tL2NvcmVsZHJhdy9vZG0vMjAwMyI+CjxnIGlkPSJfMTQyMTM0NDAyMzMyOCI+CjxwYXRoIGZpbGw9IiNGNzkzMUEiIGZpbGwtcnVsZT0ibm9uemVybyIgZD0iTTQwMzAuMDYgMjU0MC43N2MtMjczLjI0LDEwOTYuMDEgLTEzODMuMzIsMTc2My4wMiAtMjQ3OS40NiwxNDg5LjcxIC0xMDk1LjY4LC0yNzMuMjQgLTE3NjIuNjksLTEzODMuMzkgLTE0ODkuMzMsLTI0NzkuMzEgMjczLjEyLC0xMDk2LjEzIDEzODMuMiwtMTc2My4xOSAyNDc5LC0xNDg5Ljk1IDEwOTYuMDYsMjczLjI0IDE3NjMuMDMsMTM4My41MSAxNDg5Ljc2LDI0NzkuNTdsMC4wMiAtMC4wMnoiLz4KPHBhdGggZmlsbD0id2hpdGUiIGZpbGwtcnVsZT0ibm9uemVybyIgZD0iTTI5NDcuNzcgMTc1NC4zOGM0MC43MiwtMjcyLjI2IC0xNjYuNTYsLTQxOC42MSAtNDUwLC01MTYuMjRsOTEuOTUgLTM2OC44IC0yMjQuNSAtNTUuOTQgLTg5LjUxIDM1OS4wOWMtNTkuMDIsLTE0LjcyIC0xMTkuNjMsLTI4LjU5IC0xNzkuODcsLTQyLjM0bDkwLjE2IC0zNjEuNDYgLTIyNC4zNiAtNTUuOTQgLTkyIDM2OC42OGMtNDguODQsLTExLjEyIC05Ni44MSwtMjIuMTEgLTE0My4zNSwtMzMuNjlsMC4yNiAtMS4xNiAtMzA5LjU5IC03Ny4zMSAtNTkuNzIgMjM5Ljc4YzAsMCAxNjYuNTYsMzguMTggMTYzLjA1LDQwLjUzIDkwLjkxLDIyLjY5IDEwNy4zNSw4Mi44NyAxMDQuNjIsMTMwLjU3bC0xMDQuNzQgNDIwLjE1YzYuMjYsMS41OSAxNC4zOCwzLjg5IDIzLjM0LDcuNDkgLTcuNDksLTEuODYgLTE1LjQ2LC0zLjg5IC0yMy43MywtNS44N2wtMTQ2LjgxIDU4OC41N2MtMTEuMTEsMjcuNjIgLTM5LjMxLDY5LjA3IC0xMDIuODcsNTMuMzMgMi4yNSwzLjI2IC0xNjMuMTcsLTQwLjcyIC0xNjMuMTcsLTQwLjcybC0xMTEuNDYgMjU2Ljk4IDI5Mi4xNSA3Mi44M2M1NC4zNSwxMy42MyAxMDcuNjEsMjcuODkgMTYwLjA2LDQxLjNsLTkyLjkgMzczLjAzIDIyNC4yNCA1NS45NCA5MiAtMzY5LjA3YzYxLjI2LDE2LjYzIDEyMC43MSwzMS45NyAxNzguOTEsNDYuNDNsLTkxLjY5IDM2Ny4zMyAyMjQuNTEgNTUuOTQgOTIuODkgLTM3Mi4zM2MzODIuODIsNzIuNDUgNjcwLjY3LDQzLjI0IDc5MS44MywtMzAzLjAyIDk3LjYzLC0yNzguNzggLTQuODYsLTQzOS41OCAtMjA2LjI2LC01NDQuNDQgMTQ2LjY5LC0zMy44MyAyNTcuMTgsLTEzMC4zMSAyODYuNjQsLTMyOS42MWwtMC4wNyAtMC4wNXptLTUxMi45MyA3MTkuMjZjLTY5LjM4LDI3OC43OCAtNTM4Ljc2LDEyOC4wOCAtNjkwLjk0LDkwLjI5bDEyMy4yOCAtNDk0LjJjMTUyLjE3LDM3Ljk5IDY0MC4xNywxMTMuMTcgNTY3LjY3LDQwMy45MXptNjkuNDMgLTcyMy4zYy02My4yOSwyNTMuNTggLTQ1My45NiwxMjQuNzUgLTU4MC42OSw5My4xNmwxMTEuNzcgLTQ0OC4yMWMxMjYuNzMsMzEuNTkgNTM0Ljg1LDkwLjU1IDQ2OC45NCwzNTUuMDVsLTAuMDIgMHoiLz4KPC9nPgo8L3N2Zz4K',
        symbol: 'BTC',
        abi: null,
        walletApi: eSupportedInterfaces.btc,
        contractAddress:
          chainId === 1
            ? contractAddresses.wrappedBtcMain
            : chainId === 3
              ? '0x442Be68395613bDCD19778e761f03261ec46C06D'
              : null,
        decimalPlaces: 8,
        WalletInterface: BtcWallet,
      },
      {
        name: 'Ethereum',
        symbol: 'ETH',
        backgroundColor: '#669AFF',
        icon:
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIHZpZXdCb3g9IjAgMCA1NiA1NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyNy42NDYiIGN5PSIyNy42NDYiIHI9IjI3LjIzOSIgdHJhbnNmb3JtPSJyb3RhdGUoLS44NjMgMjcuNjQ2IDI3LjY0NikiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMjcuNDk2IDRsLS4zMTcgMS4wN3YzMS4wNzFsLjMxNy4zMTVMNDEuOTkgMjcuOTMgMjcuNDk2IDR6IiBmaWxsPSIjN0I4OEM3Ii8+PHBhdGggZD0iTTI3LjQ5NiA0TDEzIDI3LjkzbDE0LjQ5NiA4LjUyNlY0eiIgZmlsbD0iI0EyQUFEOCIvPjxwYXRoIGQ9Ik0yNy40OTYgMzkuMTg3bC0uMTc5LjIxNlY1MC40N2wuMTc5LjUxOUw0MiAzMC42NjVsLTE0LjUwNCA4LjUyeiIgZmlsbD0iIzdCODhDNyIvPjxwYXRoIGQ9Ik0yNy40OTYgNTAuOTlWMzkuMTg1TDEzIDMwLjY2NmwxNC40OTYgMjAuMzIzeiIgZmlsbD0iI0EyQUFEOCIvPjxwYXRoIGQ9Ik0yNy40OTYgMzYuNDU2TDQxLjk5IDI3LjkzbC0xNC40OTUtNi41NTZ2MTUuMDh6IiBmaWxsPSIjNUQ2REJDIi8+PHBhdGggZD0iTTEzIDI3LjkzbDE0LjQ5NiA4LjUyNnYtMTUuMDhMMTMgMjcuOTN6IiBmaWxsPSIjN0I4OEM3Ii8+PC9zdmc+',
        abi: null,
        walletApi: eSupportedInterfaces.eth,
        contractAddress:
          chainId === 1
            ? contractAddresses.wrappedEthMain
            : chainId === 3
              ? '0xc778417e063141139fce010982780140aa0cd5ab'
              : null,
        decimalPlaces: 18,
        WalletInterface: EthWallet,
      },
      {
        walletApi: eSupportedInterfaces.doc,
        name: 'Win',
        symbol: 'WIN',
        backgroundColor: '#0066FF',
        icon:
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTUiIGhlaWdodD0iNTUiIHZpZXdCb3g9IjAgMCA1NSA1NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTI4LjA1NyA1NC44ODNjMTUuMDQyLS4yMjcgMjcuMDUyLTEyLjYwNSAyNi44MjYtMjcuNjQ3QzU0LjY1NiAxMi4xOTQgNDIuMjc4LjE4NCAyNy4yMzYuNDEgMTIuMTk0LjYzNy4xODQgMTMuMDE1LjQxIDI4LjA1N2MuMjI3IDE1LjA0MiAxMi42MDUgMjcuMDUyIDI3LjY0NyAyNi44MjZ6TTEwIDE3aDVsNC41IDE0LjUgNi0xNC41SDI5bDYgMTQuNUw0MC41IDE3SDQ1bC03IDIxLjVoLTQuNWwtNi0xNC41TDIyIDM4LjVoLTQuNUwxMCAxN3oiIGZpbGw9IiNmZmYiLz48L3N2Zz4=',
        abi: null,
        decimalPlaces: 8,
        contractAddress: '',
        WalletInterface: DocWallet,
      },
      {
        name: 'Green',
        symbol: 'GREEN',
        backgroundColor: '#0ACE00',
        icon:
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTUiIGhlaWdodD0iNTUiIHZpZXdCb3g9IjAgMCA1NSA1NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTI3LjY1IDU0LjQ3NWMxNS4wNDItLjIyNiAyNy4wNTItMTIuNjA0IDI2LjgyNS0yNy42NDZDNTQuMjUgMTEuNzg3IDQxLjg3MS0uMjIzIDI2LjgzLjAwMyAxMS43ODcuMjMtLjIyMyAxMi42MDcuMDAzIDI3LjY1LjIzIDQyLjY5MiAxMi42MDcgNTQuNzAyIDI3LjY1IDU0LjQ3NXptMS45NDMtNDMuODgybC0xMiAxOWgxMGwtMiAxNCAxMi0xOC05LTEgMS0xNHoiIGZpbGw9IiNmZmYiLz48L3N2Zz4=',
        abi: erc20GreenAbi,
        walletApi: eSupportedInterfaces.erc20,
        contractAddress:
          chainId === 1
            ? contractAddresses.greenMain
            : chainId === 3 || chainId === 1337
              ? contractAddresses.green
              : null,
        decimalPlaces: 8,
        WalletInterface: Erc20Wallet,
      },
    
      {
        walletApi: eSupportedInterfaces.doc,
        name: 'Switch',
        symbol: 'SWITCH',
        backgroundColor: '#0ACE00',
        icon:
          'data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MjYuNjggMzU0LjEyIj48cGF0aCBkPSJNMCwyNmExMy40OSwxMy40OSwwLDAsMCwuOS0yLjQxQzMuMiwxMS41NSwxNS41OC0uMTgsMjkuNzksMCw1MCwuMjcsNzAuMjUuMTksOTAuNDguMTlxMTQ0LjIsMCwyODguMzgsMGM2LjA3LDAsMTIuMTUsMCwxOC4yMywwQzQwOS4xMiwwLDQxNy41MSw2LDQyMy4zNiwxNmEyNSwyNSwwLDAsMSwzLjI1LDEyLjg2cTAsMzguMTEtLjA1LDc2LjI1LDAsNjguOTQtLjA1LDEzNy44OGMwLDI3LjI1LS4xMiw1NC41MS4xNyw4MS43Ni4xNSwxMy44NC0xMS4zMiwyNi42OS0yNC4xMiwyOC45M2E5LjYxLDkuNjEsMCwwLDAtMS4zNS40M0gyNS40NGE0Ljg5LDQuODksMCwwLDAtLjg0LS4zOUMxMS44MywzNTAuNzksNCwzNDIuOTIuODYsMzMwLjIxYy0uMjEtLjg0LS41Ny0xLjY1LS44Ni0yLjQ3VjIxMS4xOGExMy4xNSwxMy4xNSwwLDAsMCwuNDItMi4yOXEwLTMxLDAtNjIuMUExMy4zMiwxMy4zMiwwLDAsMCwwLDE0NC41Wk0xMzcsMjQ5LjE1aDIuNjRjMTIsMCwyNCwuMDcsMzYsLjA2LDE4LDAsMzYtLjA3LDU0LS4wOGEyMS4yNCwyMS4yNCwwLDAsMSwzLjU2LjMzLDIuODUsMi44NSwwLDAsMSwyLjM3LDIuNjcsMTMuNjQsMTMuNjQsMCwwLDEsLjA2LDEuOTJjMCw3LjkxLS4wNSwxNS44Mi0uMDUsMjMuNzNhMTEuMjgsMTEuMjgsMCwwLDAsLjMsMS42OUwzMTEuNzUsMjIzYTguODEsOC44MSwwLDAsMS0xLjI2LS41OUwyMzUuNzQsMTY3YS4zNy4zNywwLDAsMC0uMjMsMCwzLjM3LDMuMzcsMCwwLDAtLjQ2LjE3djMwSDE2OS42Yy01LjQ0LDAtMTAuODcsMC0xNi4zMSwwcy0xMC44LS4xNy0xNi4yNi4xMlpNMTkyLjU0LDY0LjYyLDExNS44MSwxMTksMTkzLDE3My41OFYxNDMuOTJoOTguOTNjLjUzLTIuNzEuNDUtNDguNDItLjA1LTUwLjE1bC0uMjItLjA3LS4yNCwwLS4yNCwwSDE5My41M2MtLjE2LDAtLjMyLDAtLjQ3LS4wOWEuNTkuNTksMCwwLDEtLjItLjEyLDQuNDIsNC40MiwwLDAsMS0uMzItLjM0WiIvPjwvc3ZnPg==',
        abi: null,
        decimalPlaces: 8,
        contractAddress: undefined,
        WalletInterface: DocWallet,
      },
      {
        walletApi: eSupportedInterfaces.doc,
        name: 'Blue',
        symbol: 'BLUE',
        backgroundColor: '#0066FF',
        icon:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJJSURBVHgB7ZoxaxRBFMd/e5ecpx6aQiUqJBZKAmIhFhY2h42FjVjaaOXXCPpFJBb6BSSghRtQbCOooIhKUIJIMFGTS7y923FeJoqXbJIJzBy7m/nBY/dmhp377+7Mm/d2YB2lVFNbrG1BFYNY203+RxdMqGKSapsQDZE+uaWP9yguSttlERLrkybFJhYhiuKzUBYhqkJJKI2QATyRdKDT3dBZFQY99ej8sqkecc9m4OET+PKtt+7CONy4AmOjOMe5kCSBt7Pw6gO0k96617rs05wfIe7HSGReoWrGlatVYz4Is1beCELyRhCSN4KQrRjUfqKm3WwUba6TskqEF6w9+/efMPsVfi1v307WWO8/Q7e7uW55Bd58tFtvHRmC0WE4uB8rrOKRpRbcn4IHj+F3Ql84cRRuX4Orl6ya28Ujq234sdQ/EUJrxTxBW6yErL3blbVlVN+Q/iq7GMF7a9aSUZSmJu/SL7qp6dMWKyH1fWYWaVjOIC4YasDhhn176yxKaxXmF81xO9p6+p16AY+e68mh3VsnM9H1Jlw8y44capibV7NzEMrajxyow8jwzu3Ef8y8yw6s6jU4eQzGT+Ec54O9k5qkQ9ZzljJfWbSw1sobQUjeCELyRhCyJcr4kU5GYCVlWQGXC5znfiX6GxuB82dgbr53oXnutI76juMFb1+ssu6+5H0H/OR+Vfj0ljeCkLxRKiGLlAAR8pLiMy1C7lBsxH1MVqIomsaIKao/uas1TP77JdudtD1d3wPlynwhm+Nibc2///8P+iXIMzL+1hcAAAAASUVORK5CYII=',
        abi: null,
        decimalPlaces: 8,
        contractAddress: undefined,
        WalletInterface: DocWallet,
      },
      {
        walletApi: eSupportedInterfaces.doc,
        name: 'Galvan',
        symbol: 'IZE',
        backgroundColor: '#0066FF',
        icon:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJJSURBVHgB7ZoxaxRBFMd/e5ecpx6aQiUqJBZKAmIhFhY2h42FjVjaaOXXCPpFJBb6BSSghRtQbCOooIhKUIJIMFGTS7y923FeJoqXbJIJzBy7m/nBY/dmhp377+7Mm/d2YB2lVFNbrG1BFYNY203+RxdMqGKSapsQDZE+uaWP9yguSttlERLrkybFJhYhiuKzUBYhqkJJKI2QATyRdKDT3dBZFQY99ej8sqkecc9m4OET+PKtt+7CONy4AmOjOMe5kCSBt7Pw6gO0k96617rs05wfIe7HSGReoWrGlatVYz4Is1beCELyRhCSN4KQrRjUfqKm3WwUba6TskqEF6w9+/efMPsVfi1v307WWO8/Q7e7uW55Bd58tFtvHRmC0WE4uB8rrOKRpRbcn4IHj+F3Ql84cRRuX4Orl6ya28Ujq234sdQ/EUJrxTxBW6yErL3blbVlVN+Q/iq7GMF7a9aSUZSmJu/SL7qp6dMWKyH1fWYWaVjOIC4YasDhhn176yxKaxXmF81xO9p6+p16AY+e68mh3VsnM9H1Jlw8y44capibV7NzEMrajxyow8jwzu3Ef8y8yw6s6jU4eQzGT+Ec54O9k5qkQ9ZzljJfWbSw1sobQUjeCELyRhCyJcr4kU5GYCVlWQGXC5znfiX6GxuB82dgbr53oXnutI76juMFb1+ssu6+5H0H/OR+Vfj0ljeCkLxRKiGLlAAR8pLiMy1C7lBsxH1MVqIomsaIKao/uas1TP77JdudtD1d3wPlynwhm+Nibc2///8P+iXIMzL+1hcAAAAASUVORK5CYII=',
        abi: null,
        decimalPlaces: 8,
        contractAddress: undefined,
        WalletInterface: DocWallet,
      },
      {
        walletApi: eSupportedInterfaces.doc,
        name: 'Give',
        symbol: 'GIVE',
        backgroundColor: '#0066FF',
        icon:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJJSURBVHgB7ZoxaxRBFMd/e5ecpx6aQiUqJBZKAmIhFhY2h42FjVjaaOXXCPpFJBb6BSSghRtQbCOooIhKUIJIMFGTS7y923FeJoqXbJIJzBy7m/nBY/dmhp377+7Mm/d2YB2lVFNbrG1BFYNY203+RxdMqGKSapsQDZE+uaWP9yguSttlERLrkybFJhYhiuKzUBYhqkJJKI2QATyRdKDT3dBZFQY99ej8sqkecc9m4OET+PKtt+7CONy4AmOjOMe5kCSBt7Pw6gO0k96617rs05wfIe7HSGReoWrGlatVYz4Is1beCELyRhCSN4KQrRjUfqKm3WwUba6TskqEF6w9+/efMPsVfi1v307WWO8/Q7e7uW55Bd58tFtvHRmC0WE4uB8rrOKRpRbcn4IHj+F3Ql84cRRuX4Orl6ya28Ujq234sdQ/EUJrxTxBW6yErL3blbVlVN+Q/iq7GMF7a9aSUZSmJu/SL7qp6dMWKyH1fWYWaVjOIC4YasDhhn176yxKaxXmF81xO9p6+p16AY+e68mh3VsnM9H1Jlw8y44capibV7NzEMrajxyow8jwzu3Ef8y8yw6s6jU4eQzGT+Ec54O9k5qkQ9ZzljJfWbSw1sobQUjeCELyRhCyJcr4kU5GYCVlWQGXC5znfiX6GxuB82dgbr53oXnutI76juMFb1+ssu6+5H0H/OR+Vfj0ljeCkLxRKiGLlAAR8pLiMy1C7lBsxH1MVqIomsaIKao/uas1TP77JdudtD1d3wPlynwhm+Nibc2///8P+iXIMzL+1hcAAAAASUVORK5CYII=',
        abi: null,
        decimalPlaces: 8,
        contractAddress: undefined,
        WalletInterface: DocWallet,
      },
      {
        name: 'Gala',
        symbol: 'GALA',
        backgroundColor: '#161618',
        icon:
          'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDIwMDEwOTA0Ly9FTiIKICJodHRwOi8vd3d3LnczLm9yZy9UUi8yMDAxL1JFQy1TVkctMjAwMTA5MDQvRFREL3N2ZzEwLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjAiIHdpZHRoPSI1MTIuMDAwMDAwcHQiIGhlaWdodD0iNTEyLjAwMDAwMHB0IiB2aWV3Qm94PSIwIDAgNTEyLjAwMDAwMCA1MTIuMDAwMDAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBtZWV0IiBzdHlsZT0iJiMxMDsiPgoKPGNpcmNsZSBjeD0iMjU2IiBjeT0iMjU2IiByPSIyNTYiIGZpbGw9IiMwMDAwMDAiLz4KPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4wMDAwMDAsNTEyLjAwMDAwMCkgc2NhbGUoMC4xMDAwMDAsLTAuMTAwMDAwKSIgZmlsbD0iI2ZmZmZmZiIgc3Ryb2tlPSJub25lIj4KPHBhdGggZD0iTTI0NTAgNDUwMSBjLTU4IC0zMSAtMTQ1IC03OSAtMTk1IC0xMDYgLTExOCAtNjQgLTI0NCAtMTMyIC02MzAgLTM0MCAtMTc2IC05NSAtMzcyIC0yMDEgLTQzNSAtMjM1IC02MyAtMzQgLTE1NyAtODUgLTIwOCAtMTEzIC01MSAtMjcgLTkwIC01MyAtODUgLTU3IDQgLTUgMTY2IC05OSAzNTggLTIxMCAxOTMgLTExMSAzNzkgLTIxOSA0MTUgLTI0MCAzNiAtMjEgMjExIC0xMjIgMzkwIC0yMjUgMTc5IC0xMDMgMzYyIC0yMDkgNDA4IC0yMzYgNDUgLTI3IDg3IC00OSA5MiAtNDkgNiAwIDQzIDE5IDgzIDQzIDM5IDI0IDE4MSAxMDYgMzEzIDE4MyAyMDEgMTE1IDIzOSAxNDEgMjI1IDE1MCAtOSA2IC02OSA0MiAtMTMzIDc5IGwtMTE3IDY3IC0xODYgLTEwNyAtMTg1IC0xMDcgLTIxMyAxMjMgYy0xMTYgNjcgLTI1MiAxNDYgLTMwMiAxNzUgLTQ5IDI4IC0yMDUgMTE4IC0zNDUgMTk5IC0xNDAgODEgLTI1NiAxNDggLTI1OCAxNTAgLTIgMiAzOSAyNSA5MCA1MiAxMDIgNTUgMTkyIDEwMyA2ODcgMzcyIDE4NCA5OSAzMzggMTgxIDM0MSAxODEgMyAwIDE1NyAtODIgMzQxIC0xODEgNDQyIC0yNDAgNTI1IC0yODUgOTI0IC00OTkgNDQgLTI0IDg5IC00OSAxMDAgLTU3IDExIC03IDI1IC0xMyAzMiAtMTMgMTMgMCAyNDggMTMzIDI2NiAxNTAgNSA0IC0zNCAzMCAtODUgNTcgLTUxIDI4IC0xNDUgNzkgLTIwOCAxMTMgLTEwMSA1NCAtNDkxIDI2NSAtODgwIDQ3NSAtNjkgMzcgLTE0NyA4MCAtMTc1IDk1IC04OSA0OSAtMzE3IDE3MCAtMzE4IDE2OSAtMSAwIC00OSAtMjYgLTEwNyAtNTh6Ii8+CjxwYXRoIGQ9Ik03ODAgMjU2MiBsMCAtOTU5IDEyOCAtNzggYzcwIC00MyAxNzIgLTEwNiAyMjcgLTE0MCAxNTUgLTk2IDQxMSAtMjUzIDUwNSAtMzExIDQ3IC0yOCAxNzEgLTEwNCAyNzUgLTE2OSAzODEgLTIzNiA1NDYgLTMzNSA1NTUgLTMzNSA3IDAgOSAzNDMgOCA5ODYgbC0zIDk4NiAtMTI1IDcyIGMtMzY1IDIxMiAtNTEyIDI5NiAtNTE2IDI5NiAtMiAwIC00IC02OSAtNCAtMTUzIGwwIC0xNTQgMTQ4IC04NSBjODEgLTQ3IDE2NiAtOTYgMTg5IC0xMDkgbDQzIC0yNCAwIC02NjcgYzAgLTM2OCAtNCAtNjY4IC04IC02NjggLTUgMCAtNjAgMzIgLTEyMyA3MSAtNjMgMzkgLTE1MyA5NSAtMjAyIDEyNSAtMTE4IDcyIC0yMTIgMTMxIC01NDQgMzM1IGwtMjgzIDE3NCAwIDgwNSAwIDgwNSAtODcgNTAgYy00OCAyOCAtMTA5IDYyIC0xMzUgNzggbC00OCAyNyAwIC05NTh6Ii8+CjxwYXRoIGQ9Ik00MTE1IDMzOTEgYy0xMjEgLTcwIC00NDUgLTI1NyAtNzIwIC00MTYgLTI3NSAtMTU4IC01NTYgLTMyMSAtNjI1IC0zNjEgbC0xMjUgLTcyIC0zIC0zNzYgYy0xIC0yMDcgMCAtMzc2IDQgLTM3NiAzIDAgNjQgMzMgMTM1IDczIGwxMjkgNzIgMCAyMjUgMCAyMjUgNTMgMjkgYzI4IDE2IDEyMCA2OSAyMDIgMTE2IDMxNyAxODQgODYxIDQ5OCA4ODMgNTA5IGwyMiAxMiAwIC02NDggMCAtNjQ4IC0yMjcgLTE0MCBjLTEyNSAtNzcgLTI3MCAtMTY2IC0zMjIgLTE5OSAtNTMgLTMyIC0xMjcgLTc3IC0xNjYgLTEwMSAtMzggLTIzIC0xMjYgLTc3IC0xOTUgLTEyMCAtNjkgLTQzIC0yMDYgLTEyNyAtMzA1IC0xODggLTk5IC02MCAtMTg4IC0xMTcgLTE5NyAtMTI1IC0xNiAtMTMgLTE4IC0zNSAtMTggLTE2NCAwIC05MCA0IC0xNDggMTAgLTE0OCA5IDAgMTc0IDEwMCA1NTUgMzM1IDEwNSA2NSAyMjggMTQxIDI3NSAxNjkgOTQgNTggMzUwIDIxNSA1MDUgMzExIDU1IDM0IDE1NyA5NyAyMjggMTQwIGwxMjcgNzggMCA5NTggYzAgNTI4IC0xIDk1OSAtMiA5NTkgLTIgLTEgLTEwMiAtNTggLTIyMyAtMTI5eiIvPgo8L2c+Cjwvc3ZnPgoKCg==',
        abi: erc20Abi,
        walletApi: eSupportedInterfaces.erc20,
        contractAddress:
          chainId === 1
            ? contractAddresses.galaMain
            : chainId === 3 || chainId === 1337
              ? contractAddresses.gala
              : null,
        decimalPlaces: 8,
        WalletInterface: Erc20Wallet,
      },
    
      {
        walletApi: eSupportedInterfaces.doc,
        name: 'Boxcoin',
        symbol: 'BXC',
        backgroundColor: '#0066FF',
        icon:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJJSURBVHgB7ZoxaxRBFMd/e5ecpx6aQiUqJBZKAmIhFhY2h42FjVjaaOXXCPpFJBb6BSSghRtQbCOooIhKUIJIMFGTS7y923FeJoqXbJIJzBy7m/nBY/dmhp377+7Mm/d2YB2lVFNbrG1BFYNY203+RxdMqGKSapsQDZE+uaWP9yguSttlERLrkybFJhYhiuKzUBYhqkJJKI2QATyRdKDT3dBZFQY99ej8sqkecc9m4OET+PKtt+7CONy4AmOjOMe5kCSBt7Pw6gO0k96617rs05wfIe7HSGReoWrGlatVYz4Is1beCELyRhCSN4KQrRjUfqKm3WwUba6TskqEF6w9+/efMPsVfi1v307WWO8/Q7e7uW55Bd58tFtvHRmC0WE4uB8rrOKRpRbcn4IHj+F3Ql84cRRuX4Orl6ya28Ujq234sdQ/EUJrxTxBW6yErL3blbVlVN+Q/iq7GMF7a9aSUZSmJu/SL7qp6dMWKyH1fWYWaVjOIC4YasDhhn176yxKaxXmF81xO9p6+p16AY+e68mh3VsnM9H1Jlw8y44capibV7NzEMrajxyow8jwzu3Ef8y8yw6s6jU4eQzGT+Ec54O9k5qkQ9ZzljJfWbSw1sobQUjeCELyRhCyJcr4kU5GYCVlWQGXC5znfiX6GxuB82dgbr53oXnutI76juMFb1+ssu6+5H0H/OR+Vfj0ljeCkLxRKiGLlAAR8pLiMy1C7lBsxH1MVqIomsaIKao/uas1TP77JdudtD1d3wPlynwhm+Nibc2///8P+iXIMzL+1hcAAAAASUVORK5CYII=',
        abi: null,
        decimalPlaces: 8,
        contractAddress: undefined,
        WalletInterface: DocWallet,
      },
      {
        walletApi: eSupportedInterfaces.doc,
        name: 'Elevate',
        symbol: 'ELEVATE',
        backgroundColor: '#0066FF',
        icon:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJJSURBVHgB7ZoxaxRBFMd/e5ecpx6aQiUqJBZKAmIhFhY2h42FjVjaaOXXCPpFJBb6BSSghRtQbCOooIhKUIJIMFGTS7y923FeJoqXbJIJzBy7m/nBY/dmhp377+7Mm/d2YB2lVFNbrG1BFYNY203+RxdMqGKSapsQDZE+uaWP9yguSttlERLrkybFJhYhiuKzUBYhqkJJKI2QATyRdKDT3dBZFQY99ej8sqkecc9m4OET+PKtt+7CONy4AmOjOMe5kCSBt7Pw6gO0k96617rs05wfIe7HSGReoWrGlatVYz4Is1beCELyRhCSN4KQrRjUfqKm3WwUba6TskqEF6w9+/efMPsVfi1v307WWO8/Q7e7uW55Bd58tFtvHRmC0WE4uB8rrOKRpRbcn4IHj+F3Ql84cRRuX4Orl6ya28Ujq234sdQ/EUJrxTxBW6yErL3blbVlVN+Q/iq7GMF7a9aSUZSmJu/SL7qp6dMWKyH1fWYWaVjOIC4YasDhhn176yxKaxXmF81xO9p6+p16AY+e68mh3VsnM9H1Jlw8y44capibV7NzEMrajxyow8jwzu3Ef8y8yw6s6jU4eQzGT+Ec54O9k5qkQ9ZzljJfWbSw1sobQUjeCELyRhCyJcr4kU5GYCVlWQGXC5znfiX6GxuB82dgbr53oXnutI76juMFb1+ssu6+5H0H/OR+Vfj0ljeCkLxRKiGLlAAR8pLiMy1C7lBsxH1MVqIomsaIKao/uas1TP77JdudtD1d3wPlynwhm+Nibc2///8P+iXIMzL+1hcAAAAASUVORK5CYII=',
        abi: null,
        decimalPlaces: 8,
        contractAddress: undefined,
        WalletInterface: DocWallet,
      },
      {
        walletApi: eSupportedInterfaces.doc,
        name: 'Liberty',
        symbol: 'LIBERTY',
        backgroundColor: '#0066FF',
        icon:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJJSURBVHgB7ZoxaxRBFMd/e5ecpx6aQiUqJBZKAmIhFhY2h42FjVjaaOXXCPpFJBb6BSSghRtQbCOooIhKUIJIMFGTS7y923FeJoqXbJIJzBy7m/nBY/dmhp377+7Mm/d2YB2lVFNbrG1BFYNY203+RxdMqGKSapsQDZE+uaWP9yguSttlERLrkybFJhYhiuKzUBYhqkJJKI2QATyRdKDT3dBZFQY99ej8sqkecc9m4OET+PKtt+7CONy4AmOjOMe5kCSBt7Pw6gO0k96617rs05wfIe7HSGReoWrGlatVYz4Is1beCELyRhCSN4KQrRjUfqKm3WwUba6TskqEF6w9+/efMPsVfi1v307WWO8/Q7e7uW55Bd58tFtvHRmC0WE4uB8rrOKRpRbcn4IHj+F3Ql84cRRuX4Orl6ya28Ujq234sdQ/EUJrxTxBW6yErL3blbVlVN+Q/iq7GMF7a9aSUZSmJu/SL7qp6dMWKyH1fWYWaVjOIC4YasDhhn176yxKaxXmF81xO9p6+p16AY+e68mh3VsnM9H1Jlw8y44capibV7NzEMrajxyow8jwzu3Ef8y8yw6s6jU4eQzGT+Ec54O9k5qkQ9ZzljJfWbSw1sobQUjeCELyRhCyJcr4kU5GYCVlWQGXC5znfiX6GxuB82dgbr53oXnutI76juMFb1+ssu6+5H0H/OR+Vfj0ljeCkLxRKiGLlAAR8pLiMy1C7lBsxH1MVqIomsaIKao/uas1TP77JdudtD1d3wPlynwhm+Nibc2///8P+iXIMzL+1hcAAAAASUVORK5CYII=',
        abi: null,
        decimalPlaces: 8,
        contractAddress: undefined,
        WalletInterface: DocWallet,
      },
      {
        walletApi: eSupportedInterfaces.doc,
        name: 'Element',
        symbol: 'ELEMENT',
        backgroundColor: '#0066FF',
        icon:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJJSURBVHgB7ZoxaxRBFMd/e5ecpx6aQiUqJBZKAmIhFhY2h42FjVjaaOXXCPpFJBb6BSSghRtQbCOooIhKUIJIMFGTS7y923FeJoqXbJIJzBy7m/nBY/dmhp377+7Mm/d2YB2lVFNbrG1BFYNY203+RxdMqGKSapsQDZE+uaWP9yguSttlERLrkybFJhYhiuKzUBYhqkJJKI2QATyRdKDT3dBZFQY99ej8sqkecc9m4OET+PKtt+7CONy4AmOjOMe5kCSBt7Pw6gO0k96617rs05wfIe7HSGReoWrGlatVYz4Is1beCELyRhCSN4KQrRjUfqKm3WwUba6TskqEF6w9+/efMPsVfi1v307WWO8/Q7e7uW55Bd58tFtvHRmC0WE4uB8rrOKRpRbcn4IHj+F3Ql84cRRuX4Orl6ya28Ujq234sdQ/EUJrxTxBW6yErL3blbVlVN+Q/iq7GMF7a9aSUZSmJu/SL7qp6dMWKyH1fWYWaVjOIC4YasDhhn176yxKaxXmF81xO9p6+p16AY+e68mh3VsnM9H1Jlw8y44capibV7NzEMrajxyow8jwzu3Ef8y8yw6s6jU4eQzGT+Ec54O9k5qkQ9ZzljJfWbSw1sobQUjeCELyRhCyJcr4kU5GYCVlWQGXC5znfiX6GxuB82dgbr53oXnutI76juMFb1+ssu6+5H0H/OR+Vfj0ljeCkLxRKiGLlAAR8pLiMy1C7lBsxH1MVqIomsaIKao/uas1TP77JdudtD1d3wPlynwhm+Nibc2///8P+iXIMzL+1hcAAAAASUVORK5CYII=',
        abi: null,
        decimalPlaces: 8,
        contractAddress: undefined,
        WalletInterface: DocWallet,
      },
      {
        walletApi: eSupportedInterfaces.doc,
        name: 'Grow',
        symbol: 'GROW',
        backgroundColor: '#0066FF',
        icon:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJJSURBVHgB7ZoxaxRBFMd/e5ecpx6aQiUqJBZKAmIhFhY2h42FjVjaaOXXCPpFJBb6BSSghRtQbCOooIhKUIJIMFGTS7y923FeJoqXbJIJzBy7m/nBY/dmhp377+7Mm/d2YB2lVFNbrG1BFYNY203+RxdMqGKSapsQDZE+uaWP9yguSttlERLrkybFJhYhiuKzUBYhqkJJKI2QATyRdKDT3dBZFQY99ej8sqkecc9m4OET+PKtt+7CONy4AmOjOMe5kCSBt7Pw6gO0k96617rs05wfIe7HSGReoWrGlatVYz4Is1beCELyRhCSN4KQrRjUfqKm3WwUba6TskqEF6w9+/efMPsVfi1v307WWO8/Q7e7uW55Bd58tFtvHRmC0WE4uB8rrOKRpRbcn4IHj+F3Ql84cRRuX4Orl6ya28Ujq234sdQ/EUJrxTxBW6yErL3blbVlVN+Q/iq7GMF7a9aSUZSmJu/SL7qp6dMWKyH1fWYWaVjOIC4YasDhhn176yxKaxXmF81xO9p6+p16AY+e68mh3VsnM9H1Jlw8y44capibV7NzEMrajxyow8jwzu3Ef8y8yw6s6jU4eQzGT+Ec54O9k5qkQ9ZzljJfWbSw1sobQUjeCELyRhCyJcr4kU5GYCVlWQGXC5znfiX6GxuB82dgbr53oXnutI76juMFb1+ssu6+5H0H/OR+Vfj0ljeCkLxRKiGLlAAR8pLiMy1C7lBsxH1MVqIomsaIKao/uas1TP77JdudtD1d3wPlynwhm+Nibc2///8P+iXIMzL+1hcAAAAASUVORK5CYII=',
        abi: null,
        decimalPlaces: 8,
        contractAddress: undefined,
        WalletInterface: DocWallet,
      },
      {
        walletApi: eSupportedInterfaces.doc,
        name: 'Air',
        symbol: 'AIR',
        backgroundColor: '#0066FF',
        icon: '',
        abi: null,
        decimalPlaces: 8,
        contractAddress: undefined,
        WalletInterface: DocWallet,
      },
      {
        walletApi: eSupportedInterfaces.doc,
        name: 'Water',
        symbol: 'WATER',
        backgroundColor: '#0066FF',
        icon: '',
        abi: null,
        decimalPlaces: 8,
        contractAddress: undefined,
        WalletInterface: DocWallet,
      },
      {
        walletApi: eSupportedInterfaces.doc,
        name: 'Tether USD',
        symbol: 'USDT',
        backgroundColor: '#0066FF',
        icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
        abi: erc20Abi,
        decimalPlaces: 6,
        contractAddress: this.ethChainIDs.includes(chainId)
          ? contractAddresses.usdtMain
          : '0x110a13fc3efe6a245b50102d2d79b3e76125ae83',
        WalletInterface: Erc20Wallet,
      },
      {
        walletApi: eSupportedInterfaces.doc,
        name: 'USD Coin',
        symbol: 'USDC',
        backgroundColor: '#0066FF',
        icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
        abi: erc20Abi,
        decimalPlaces: 6,
        contractAddress: this.ethChainIDs.includes(chainId)
          ? contractAddresses.usdcMain
          : '0x07865c6e87b9f70255377e024ace6630c1eaa37f',
        WalletInterface: Erc20Wallet,
      },
      {
        walletApi: eSupportedInterfaces.doc,
        name: 'Binance USD',
        symbol: 'BUSD',
        backgroundColor: '#0066FF',
        icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4687.png',
        abi: erc20Abi,
        decimalPlaces: 18,
        contractAddress: contractAddresses.busdMain,
        WalletInterface: Erc20Wallet,
      },
      {
        walletApi: eSupportedInterfaces.doc,
        name: 'Basic Attention Token',
        symbol: 'BAT',
        backgroundColor: '#0066FF',
        icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1697.png',
        abi: erc20Abi,
        decimalPlaces: 18,
        contractAddress: contractAddresses.batMain,
        WalletInterface: Erc20Wallet,
      },
    ];
    return result;
  }

  public getWallet = (brand: string): ICoinMetadata => {
    const configs = this.getWalletConfigurations();
    for(const config of configs) {
      if(config.symbol.toLowerCase() === brand){
        return config;
      }
    }
    
    return undefined;
  }

  public getErc1155ContractConfig = (): ICoinMetadata  => {
    const result: ICoinMetadata = {
      walletApi: eSupportedInterfaces.erc1155,
      abi: erc1155Abi,
      WalletInterface: Erc1155Wallet,
      backgroundColor: '#FFF',
      contractAddress: this.ethChainIDs.includes(configAws.chainId)
        ? configAws.contractAddresses.galaItem
        : null,
      decimalPlaces: 0,
      icon: 'n/a',
      name: 'Gala Items',
      symbol: 'n/a',
      tokenId: 'n/a',
    };

    return result;
  }
}

const walletConfig = new WalletConfig();
export default walletConfig;
