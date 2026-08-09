import sqlite3

def main():
    conn = sqlite3.connect('rfp_database.db')
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE requirements ADD COLUMN status VARCHAR(50) DEFAULT 'Verified Compliant'")
        conn.commit()
        print("requirements table altered successfully")
    except Exception as e:
        print("Already exists or error:", e)
    finally:
        conn.close()

if __name__ == '__main__':
    main()
