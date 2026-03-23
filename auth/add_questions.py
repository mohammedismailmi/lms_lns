import sqlite3
import uuid
import json

db_path = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/be8fc967107d562340aa6bc47a19a0b8dc2ace74791bc8a07f763688e48e9db7.sqlite'
activity_id = '3743d72c-ff3d-48eb-8edd-faaf3beee62a'
tenant_id = 't1'

questions_data = [
    {
        "text": "What is the primary goal of Deep Learning?",
        "options": ["To simulate human brain structure", "To solve linear equations", "To store data efficiently", "To create web pages"],
        "correct": 0
    },
    {
        "text": "Which activation function is most commonly used in hidden layers?",
        "options": ["Sigmoid", "Tanh", "ReLU", "Softmax"],
        "correct": 2
    },
    {
        "text": "What does CNN stand for in Deep Learning?",
        "options": ["Central Neural Network", "Convolutional Neural Network", "Computer Network Node", "Complex Neural Node"],
        "correct": 1
    },
    {
        "text": "What is 'Dropout' used for?",
        "options": ["Increasing speed", "Preventing overfitting", "Memory management", "Data collection"],
        "correct": 1
    },
    {
        "text": "What is an epoch?",
        "options": ["One pass through the entire dataset", "One batch of data", "One single iteration", "One neuron in the network"],
        "correct": 0
    }
]

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Clean start for this activity
    cursor.execute("DELETE FROM questions WHERE activity_id = ?", (activity_id,))

    for i, q in enumerate(questions_data):
        q_id = str(uuid.uuid4())
        
        # Serialize to JSON as expected by the DB logic
        question_json = json.dumps({
            "text": q["text"],
            "options": q["options"],
            "correctAnswerIndex": q["correct"]
        })

        cursor.execute("""
            INSERT INTO questions (id, tenant_id, activity_id, text, type, question_type, order_index)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (q_id, tenant_id, activity_id, question_json, 'mcq', 'mcq', i))
    
    conn.commit()
    print("Success: Added 5 JSON questions to CIE-1")
except Exception as e:
    conn.rollback()
    print(f"Error: {e}")
finally:
    conn.close()
