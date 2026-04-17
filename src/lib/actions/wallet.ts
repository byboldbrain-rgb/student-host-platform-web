"use server";

import {
  getActiveWalletPaymentMethods,
  getMyDepositRequests,
  getMyWallet,
  getMyWalletTransactions,
} from "@/src/lib/services/wallet-service";

export async function getMyWalletAction() {
  return await getMyWallet();
}

export async function getMyWalletTransactionsAction(limit = 20) {
  return await getMyWalletTransactions(limit);
}

export async function getMyDepositRequestsAction(limit = 20) {
  return await getMyDepositRequests(limit);
}

export async function getWalletPaymentMethodsAction() {
  return await getActiveWalletPaymentMethods();
}