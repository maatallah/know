# Platform User Guide

Welcome to the **Know** platform—your centralized system for machine procedures, technical documentation, and operations tracking. This guide is broken down by roles.

---

## 1. General Users (Technicians & Operators)

As a standard user, your primary objective is to consume knowledge safely and efficiently.

### Using Procedures
1. **QR Code Scanning**: Point your mobile device's camera (or use the built-in scanner from the application dashboard) at a machine's QR code.
2. **Instant Access**: You will instantly bypass navigation and be taken directly to that machine’s dedicated profile.
3. **Reading Procedures**: Procedures have clearly marked risk levels. Red warning boxes mean high risk (pay special attention to preconditions and tools).
4. **Multilingual Support**: If a manual is in a language you don't understand, click the globe icon at the top right to switch between Arabic, French, and English.

### Reporting a Knowledge Gap
If you cannot find a procedure, or a procedure is incomplete:
1. Navigate to the **Knowledge Gaps** section via the sidebar.
2. Click **Submit New Gap**.
3. Provide a brief title and explain what exactly is missing.
4. Managers will review this and assign an Expert to write the missing manual.

---

## 2. Experts & Reviewers (Content Creators)

If you have authorization to create or review content, your goal is to digitize "tribal knowledge."

### Creating a Procedure (Draft)
1. Navigate to **Knowledge** -> **Create New**.
2. Fill in the required metadata (Machine, Department, Risk Level, Time Estimate).
3. Use the rich text editor to write out the steps clearly.
4. **Save as Draft** if you are still working on it.
5. Once finished, click **Submit for Review**. The state will change to `IN_REVIEW`.

### Reviewing a Procedure (Reviewer/Manager)
1. You will be notified when an item is in `IN_REVIEW`.
2. Review the technical accuracy of the content.
3. If valid, click **Approve** and add a mandatory approval comment. The document is now live and officially versioned.

---

## 3. Department Managers & Super Admins

Admins manage the physical assets (Machines), organizational structure (Departments), and user permissions.

### Managing Machines
1. Go to **Machines** -> **Add New**.
2. Define the manufacturer, model, and physical location.
3. **Printing QR Codes**: Once saved, click the **Print QR** button on the machine's detail page to generate the physical sticker for the factory floor.
4. **Duplication**: If your factory buys 5 identical sewing machines, use the **Duplicate** button. It will copy the model and manufacturer—you simply provide the new Serial Number.

### Managing Users
1. Go to **Users**.
2. Assign roles according to actual job functions:
   - **Reviewer**: Can approve procedures.
   - **Expert**: Can write drafts.
   - **Standard**: Can only read and scan.
3. Ensure users are placed in the correct standard Department (e.g., CQ, Cutting, Sewing).

### Closing Knowledge Gaps
When reviewing the **Knowledge Gaps** tab:
- **Assign**: Assign a gap to an Expert so they know it's their responsibility.
- **Close**: When closing a gap without creating a document, you **must** provide a Rejection Reason (e.g., "Duplicate request") which will be permanently logged.
