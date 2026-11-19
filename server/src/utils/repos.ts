import { prisma } from "../prisma.js";

/**
 * Data-access aliases for the two models whose operations are heavily
 * controller-facing (requests + responses). Grouping them here keeps the
 * controllers readable and gives a single place to evolve the data layer.
 */
export const bloodRequestRepo = prisma.bloodRequest;
export const requestResponseRepo = prisma.requestResponse;
