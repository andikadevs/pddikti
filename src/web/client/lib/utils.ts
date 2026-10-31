// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge conditional class names, letting later Tailwind utilities win conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
