import { Router, Response } from 'express';
import Project from '../models/Project';
import ProjectRequest from '../models/ProjectRequest';
import User from '../models/User';
import Chat from '../models/Chat';
import Notification from '../models/Notification';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendPushNotification } from '../services/pushService';

const router = Router();
router.use(authMiddleware);

// Get distinct project types listed in the database
router.get('/types', async (_req: AuthRequest, res: Response) => {
  try {
    const types = await Project.distinct('type');
    const filteredTypes = types.filter(Boolean);
    res.json({ types: filteredTypes });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get all projects with pagination and filters
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 10, 100));
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Search filter
    if (req.query.search) {
      const searchRegex = new RegExp(String(req.query.search), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    // Types filter (comma-separated list, e.g. "Short Film,Feature Film")
    if (req.query.types) {
      const typeList = String(req.query.types).split(',').map(t => t.trim()).filter(Boolean);
      if (typeList.length > 0) {
        filter.type = { $in: typeList };
      }
    }

    const total = await Project.countDocuments(filter);
    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get project detail with creator/members populated and joinRequests if owner
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const creator = await User.findById(project.createdBy).select('fullName displayName photoUrl role');
    const membersList = await User.find({ _id: { $in: project.members } }).select('fullName displayName photoUrl role');

    let joinRequests: any[] = [];
    if (project.createdBy === req.user!.id) {
      joinRequests = await ProjectRequest.find({ projectId: project.id }).sort({ createdAt: -1 });
    }

    res.json({
      project: {
        ...project.toObject(),
        creator,
        membersList,
        joinRequests
      }
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Create project
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const rolesNeeded = (req.body.rolesNeeded || []).map((r: any) => {
      if (typeof r === 'string') {
        return { role: r, filled: false, memberId: null, memberName: null };
      }
      return r;
    });

    const p = await Project.create({
      ...req.body,
      rolesNeeded,
      createdBy: req.user!.id,
      members: [req.user!.id]
    });
    res.status(201).json({ project: p });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Apply to join a role in a project
router.post('/:id/apply', async (req: AuthRequest, res: Response) => {
  try {
    const { role, note } = req.body;
    if (!role) return res.status(400).json({ error: 'Role is required' });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Check if already a member
    if (project.members.includes(req.user!.id)) {
      return res.status(400).json({ error: 'You are already a member of this project' });
    }

    // Check for existing request
    const existing = await ProjectRequest.findOne({
      projectId: req.params.id,
      userId: req.user!.id,
      status: 'Pending'
    });
    if (existing) {
      return res.status(400).json({ error: 'You have a pending application for this project' });
    }

    const currentUser = await User.findById(req.user!.id).select('fullName displayName email');
    const userName = currentUser?.fullName || currentUser?.displayName || req.user!.email?.split('@')[0] || 'User';

    const request = await ProjectRequest.create({
      projectId: req.params.id,
      userId: req.user!.id,
      userName,
      userEmail: req.user!.email,
      role,
      note: note || '',
      status: 'Pending'
    });

    // Notify director
    await Notification.create({
      userId: project.createdBy,
      type: 'project_apply',
      title: '📁 Project Join Request',
      message: `${userName} applied as ${role} for ${project.title}`,
      senderId: req.user!.id
    });
    sendPushNotification(project.createdBy, 'Project Join Request', `${userName} applied for your project`).catch(() => {});

    res.status(201).json({ success: true, request });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get current user's request for this project
router.get('/:id/my-request', async (req: AuthRequest, res: Response) => {
  try {
    const request = await ProjectRequest.findOne({
      projectId: req.params.id,
      userId: req.user!.id
    }).sort({ createdAt: -1 });

    res.json({ request });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Accept or Reject a request
router.put('/:id/requests/:requestId', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body; // 'Accepted' | 'Rejected'
    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Only creator can manage requests
    if (project.createdBy !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const request = await ProjectRequest.findById(req.params.requestId);
    if (!request || request.projectId !== req.params.id) {
      return res.status(404).json({ error: 'Request not found' });
    }

    request.status = status;
    await request.save();

    const targetUser = await User.findById(request.userId).select('fullName displayName');
    const userName = targetUser?.fullName || targetUser?.displayName || 'User';

    if (status === 'Accepted') {
      // Add member to project
      await Project.findByIdAndUpdate(req.params.id, {
        $addToSet: { members: request.userId }
      });

      // Update role status in project rolesNeeded
      const projectDoc = await Project.findById(req.params.id);
      if (projectDoc) {
        let roleFound = false;
        projectDoc.rolesNeeded = projectDoc.rolesNeeded.map(r => {
          if (r.role === request.role && !r.filled && !roleFound) {
            roleFound = true;
            return {
              role: r.role,
              filled: true,
              memberId: request.userId,
              memberName: userName
            };
          }
          return r;
        });
        await projectDoc.save();
      }

      // Add to group chat if it exists
      const chat = await Chat.findOne({ projectId: req.params.id, isGroupChat: true });
      if (chat && !chat.participants.includes(request.userId)) {
        chat.participants.push(request.userId);
        if (targetUser) {
          chat.participantNames.push(userName);
        }
        await chat.save();
      }

      // Notify applicant
      await Notification.create({
        userId: request.userId,
        type: 'project_accepted',
        title: '🎉 Project Request Accepted!',
        message: `Your request to join "${project.title}" as ${request.role} was accepted`,
        senderId: req.user!.id
      });
      sendPushNotification(request.userId, 'Project Request Accepted', `You joined "${project.title}"`).catch(() => {});
    } else {
      // Notify applicant of rejection
      await Notification.create({
        userId: request.userId,
        type: 'project_rejected',
        title: '❌ Project Request Declined',
        message: `Your request to join "${project.title}" as ${request.role} was declined`,
        senderId: req.user!.id
      });
    }

    res.json({ success: true, request });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Legacy direct join endpoint (supports fallback)
router.post('/:id/join', async (req: AuthRequest, res: Response) => {
  try {
    await Project.findByIdAndUpdate(req.params.id, { $addToSet: { members: req.user!.id } });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
