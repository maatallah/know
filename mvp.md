Web app
My setup : Node version: v24.13.0 ; PostgreSQL version: 18.1
User Volume Assumption : This is for like 30 users
File Storage Limits : Max file size is like 300MB
Authentication Model: Email/password only then SSO later

You are a senior enterprise full-stack architect.

Generate a complete, production-ready web application for:

A Digital Operational Knowledge & Skill Preservation Platform.

This system captures machine procedures, operational skills, and technical know-how in a structured, secure, multilingual format.

Output:

Full folder structure

All source code

Prisma schema

Seed script

README

.env.example

No explanations

No TODO placeholders

Must compile and run

🎯 CORE PURPOSE

The platform must:

Capture operational and machine knowledge

Preserve expert know-how

Structure procedures clearly

Enable fast querying and retrieval

Provide version control

Maintain validation workflow

Ensure long-term reliability and security

It is NOT:

An AI system

A heavy compliance SaaS

A social platform

It is a structured digital operational memory.

🌍 MULTILINGUAL REQUIREMENTS

Languages:

Arabic (default, RTL)

French

English

Must include:

next-intl

RTL/LTR automatic switching

Layout mirroring for Arabic

No hardcoded strings

Translation files separated

🎨 UI REQUIREMENTS

Clean industrial professional design

Light theme

Dark theme

Persistent toggle

Responsive layout

Accessible forms

Clean typography

Clear navigation

Loading states

Empty states

Error boundaries

🏗️ TECH STACK (MANDATORY)

Frontend:

Next.js (App Router)

TypeScript

TailwindCSS

shadcn/ui

Backend:

Next.js API routes

Prisma ORM

PostgreSQL

Authentication:

NextAuth

Role-based access control

Validation:

Zod

No paid services.
No AI.
No external SaaS.

👥 ROLES

Super Admin

Department Manager

Expert (Contributor)

Reviewer

Standard User (Reader)

RBAC enforced in API and UI.

🧱 CORE DATA MODELS

User
Role
Department
Machine
KnowledgeItem
KnowledgeVersion
Category (hierarchical)
Tag
Attachment
Comment
AuditLog
KnowledgeGapRequest

📘 KNOWLEDGE ITEM STRUCTURE

Each knowledge entry must include:

Title

Short description

Structured content (Markdown)

Type:

Machine Procedure

Work Instruction

Maintenance Guide

Troubleshooting

Safety Instruction

Training Guide

Related Machine (optional)

Department

Tags

Risk level (Low / Medium / High)

Criticality level

Estimated execution time

Required tools

Preconditions

Expected outcome

Status:

Draft

In Review

Approved

Archived

Owner

Mandatory reviewer

Contributors

Effective date

Expiry date (optional)

Versioning

View counter

Soft delete flag

🔄 WORKFLOW

Implement approval workflow:

Draft → In Review → Approved → Archived

Requirements:

Reviewer approval required

Approval comment mandatory

Version snapshot on approval

Audit log on all critical actions

Prevent editing of Approved version (must create new version)

🔎 SEARCH SYSTEM

Implement:

PostgreSQL full-text search

Filter by:

Department

Machine

Type

Risk level

Status

Tags

Sort by:

Most recent

Most viewed

Alphabetical

Must be fast and indexed.

📊 DASHBOARD

Global dashboard must show:

Total knowledge items

Items by department

Items in review

Expired items

Items near expiry

Most viewed items

Knowledge gaps submitted

Contribution stats per user

Department dashboard:

Their documents

Pending reviews

Machine coverage overview

📁 ATTACHMENTS

Support:

PDF

Images

Video

Audio

External links

Features:

File metadata storage

File size limit

Download tracking

Version replacement tracking

Storage must be local but S3-compatible architecture.

📌 KNOWLEDGE GAP FEATURE

Users can submit:

Missing procedure request

Improvement suggestion

Admin sees:

Status (Open / Assigned / Closed)

Responsible person

Linked knowledge item (if created)

📈 KNOWLEDGE HEALTH SCORE

Calculate automatically based on:

Last updated date

Approval age

View count

Comment count

Expiry proximity

Display visual indicator.

🔐 SECURITY

Protected API routes

Middleware-based RBAC

Zod validation

Secure file upload

Audit logging:

Create

Update

Delete

Approval

Role change

🗃️ DATABASE REQUIREMENTS

Enums for roles

Enums for status

Enums for risk

Soft delete pattern

Indexed search fields

Version snapshot storage

Audit timestamps

Include seed script:

Admin user

Departments

Machines

Sample knowledge entries

🏁 FINAL GOAL

Deliver a deployable, multilingual, secure operational knowledge platform that:

Records machine skills clearly

Preserves operational memory

Ensures validation

Provides fast querying

Is robust and maintainable

Is ready for long-term industrial use