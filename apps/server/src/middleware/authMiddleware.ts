import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

export interface UserRequest extends Request {
  user?: any;
}

export const authenticate = async (req: UserRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
    const profile = userDoc.exists ? (userDoc.data() as any) : null;
    if (profile?.isDeleted) {
      return res.status(403).json({ error: 'Account is deleted' });
    }
    if (profile?.disabled || profile?.status === 'banned') {
      return res.status(403).json({ error: 'Account is suspended' });
    }
    if (decodedToken.disabled) {
      return res.status(403).json({ error: 'Account is disabled' });
    }
    (decodedToken as any).role = decodedToken.role || profile?.role || 'customer';
    (decodedToken as any).email = decodedToken.email || profile?.email || '';
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: UserRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRole = req.user.role || (req.user.customClaims && req.user.customClaims.role) || req.user.claims?.role;

    if (roles.includes(userRole)) {
      next();
    } else {
      console.warn(`Permission Denied: User ${req.user.email} (UID: ${req.user.uid}) with role '${userRole}' attempted to access route needing [${roles.join(', ')}]`);
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
  };
};
