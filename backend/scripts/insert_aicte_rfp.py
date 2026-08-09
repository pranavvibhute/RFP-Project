import sqlite3
import datetime

def main():
    conn = sqlite3.connect('rfp_database.db')
    cursor = conn.cursor()
    
    # 1. Insert RFP
    # Fetch organization & user profile
    cursor.execute("SELECT id FROM organizations LIMIT 1")
    org = cursor.fetchone()
    org_id = org[0] if org else 1
    
    cursor.execute("SELECT id FROM user_profiles LIMIT 1")
    user = cursor.fetchone()
    user_id = user[0] if user else 1
    
    title = "RFP for Procurement of Cloud Services for AICTE"
    customer = "All India Council for Technical Education (AICTE)"
    filename = "aicte_cloud_rfp.pdf"
    file_path = "uploads/aicte_cloud_rfp.pdf"
    status = "Completed"
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    cursor.execute("""
        INSERT INTO rfps (organization_id, uploaded_by, title, customer_name, document_type, file_name, file_path, status, created_at)
        VALUES (?, ?, ?, ?, 'RFP', ?, ?, ?, ?)
    """, (org_id, user_id, title, customer, filename, file_path, status, now))
    
    rfp_id = cursor.lastrowid
    
    # 2. Insert Analysis
    exec_summary = (
        "The All India Council for Technical Education (AICTE) is seeking bids for the procurement of cloud hosting services "
        "and data migration on a turnkey basis initially for three years, with the possibility of extension for two years. "
        "The project involves hosting existing and new applications and migrating approximately 30 TB of legacy databases and servers "
        "to a MeitY-empaneled Cloud Service Provider (CSP) data center located in India."
    )
    opp_summary = (
        "Turnkey hosting, migration (30 TB), and managed support services for all AICTE web applications and services. "
        "Estimated budget is INR 12.00 Crore over three years."
    )
    deadline = "12/02/2026"
    budget = "INR 12.00 Crore"
    risk_score = "High"
    confidence = 0.98
    
    import json
    raw_response = {
        "analysis": {
            "executive_summary": exec_summary,
            "opportunity_summary": opp_summary,
            "submission_deadline": deadline,
            "budget": budget,
            "overall_risk": risk_score,
            "issuing_organization": customer,
            "evaluation_criteria": [
                "Technical Evaluation Score (Average Annual Turnover, Net Worth, Cloud Control Plane): 70%",
                "Financial Bid Price (Grand Total Discounted Value): 30%"
            ],
            "important_risks": [
                "Strict Data Residency: Data must not cross the Indian shores.",
                "Disaster Recovery: RTO <= 4 hours, RPO <= 2 hours.",
                "SLA Penalties: High penalties for uptime drop below 99.5% (can exceed up to 100% of monthly bill)."
            ],
            "risks": [
                {"severity": "High", "description": "Strict Data Residency: Data must not cross the Indian shores."},
                {"severity": "High", "description": "Disaster Recovery: RTO <= 4 hours, RPO <= 2 hours."},
                {"severity": "Medium", "description": "SLA Penalties: High penalties for uptime drop below 99.5% (can exceed up to 100% of monthly bill)."}
            ]
        }
    }
    
    cursor.execute("""
        INSERT INTO analyses (rfp_id, executive_summary, opportunity_summary, submission_deadline, budget, overall_risk_score, confidence_score, raw_response, created_at, analysis_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Completed')
    """, (rfp_id, exec_summary, opp_summary, deadline, budget, risk_score, confidence, json.dumps(raw_response), now))
    
    analysis_id = cursor.lastrowid
    
    # 3. Insert Requirements
    requirements = [
        ("Compute", "High", "Must support variety of operating systems (Linux, Windows Server, RedHat) and provide autoscaling on the basis of CPU utilization.", "Review Required"),
        ("Storage", "Medium", "Must support Block Storage (99.9% SLA), Object Storage (versioning/MFA), and File Storage spanning across availability zones.", "Verified Compliant"),
        ("Data Residency", "High", "The servers where applications will be hosted could be anywhere in India but not outside India. Data must never cross Indian shores.", "Review Required"),
        ("SLA / Support", "High", "Availability for each provisioned resource >= 99.5%. Supplier must manage Helpdesk (24 x 7 x 365) via telephone and email.", "Review Required"),
        ("Disaster Recovery", "High", "Disaster Recovery RTO <= 4 hours and RPO <= 2 hours. DR site must be located in India at least 100km away from DC.", "Review Required"),
        ("Migration", "High", "Must migrate approximately 30 TB of data from existing cloud services to the new cloud services quoted in the proposal.", "Review Required"),
        ("Turnover", "Medium", "Minimum average annual turnover of Rs. 500 Cr from Cloud Services during the last three financial years.", "Verified Compliant"),
        ("Certifications", "Medium", "CSP must have ISO 27001, ISO 27017, ISO 27018, ISO 20000-1 and MeitY Empanelment Certificate.", "Verified Compliant")
    ]
    
    for category, priority, text, status in requirements:
        cursor.execute("""
            INSERT INTO requirements (analysis_id, category, priority, requirement_text, status)
            VALUES (?, ?, ?, ?, ?)
        """, (analysis_id, category, priority, text, status))
        
    conn.commit()
    conn.close()
    print("AICTE cloud procurement RFP successfully populated in database!")

if __name__ == '__main__':
    main()
