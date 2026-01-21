# Research Experiment Plan: Validation of a Household Risk Prediction System

## 1. Overview
The objective of this research is to validate the effectiveness of a risk reasoning algorithm grounded in empirical accident statistics. This is achieved through two primary phases: a static performance evaluation using established datasets and a dynamic human-robot interaction (HRI) trial in a living laboratory.

---

## 2. Experiments 1 & 2: Static Evaluation of Risk Prediction
The baseline performance of the algorithm is assessed using the **NYU Depth V2 dataset** [cite: 244] alongside real-world **RGB-D imagery** captured in domestic environments[cite: 82].

* **Object Detection**: Grounded SAM2 or Detic is utilized to identify targets based on a predefined object list.
* **Risk Initialization**: Initial risk scores are assigned to detected objects based on the **Accident Information Data Bank System**.
* **Spatial Contextualization**: Object locations are mapped in 3D by integrating depth information with bounding box centroids.
* **Risk Propagation**: Scores are refined through an asymmetric propagation algorithm that considers spatial proximity and semantic accident correlations.
* **Visualization**: Updated risk heatmaps are generated and saved for qualitative and quantitative analysis.

---

## 3. Experiment 3: Human-Centric Validation
This stage quantifies the alignment between the algorithm’s outputs and human intuition/safety knowledge.

* **User Study**: Approximately 20 participants are recruited to evaluate scenes for various hazards (e.g., "Fire Risk," "Suffocation Risk") using a **Likert scale**.
* **Region Annotation**: Participants provide ground-truth data by marking perceived hazardous areas directly on the images.
* **Quantitative Metrics**:
    * The risk category with the highest human consensus is compared against the predicted heatmap using **(Cosine) Intersection over Union (IoU)**.
    * Centroid-based metrics are used to measure the spatial alignment between predicted and annotated risk zones.

---

## 4. Risk Re-estimation: Categories and Heuristic Factors
The system refines statistical risk by integrating heuristic environmental factors[cite: 339, 343].

| Risk Category | Specific Determinant Scenarios (Heuristic Factors) |
| :--- | :--- |
| **New Factors** | Risk scores increase based on room darkness (image brightness) or the presence of people and pets. |
| **Falls & Trips** | Tripping hazards caused by cables, curled rugs, or discarded boxes. |
| **Product Damage** | Mugs placed at table edges or unstable stacks of tableware. |
| **Cuts** | Unattended knives, scissors, chipped ceramics, or exposed box cutters. |
| **Fire** | Towels on stoves, or paper near candles. |
| **Burns** | Kettles after boiling, exposed hair irons |
| **Ingestion** | Unattended medication or button batteries accessible to children. |

---

## 5. Robot Verification: Active Perception and HRI
This phase validates the autonomous exploration protocol where the robot intervenes upon reaching a high level of certainty.

* **Active Perception & Navigation**:
    * **Initial Exploration**: The robot patrols designated landmarks randomly to build an initial belief state.
    * **Belief Update**: Risk probability $P(Risk \mid Obs)$ is accumulated over multiple observations using **Bayesian recursive estimation**.
    * **Dynamic Path Planning**: The robot prioritizes and increases the frequency of patrols in areas with higher current risk scores.
* **Convergence & Intervention**: 
    * Once the probability exceeds a predefined threshold and uncertainty (entropy) decreases, the robot issues an announcement via **Alexa** or **LINE**.



---

## 6. Evaluation Metrics
* **Priority Consistency**: Conduct trials in a Living Lab environment for approximately one hour with participants and the robot.
* **Subjective Appropriateness**: Conduct surveys with participants (n≈3, but **I concern that this should not be enough..**) using a Likert scale to assess:
    * **Validity**: Was the predicted risk appropriate and accurate? 
    * **Intrusiveness**: Did the robot's intervention timing interfere with human tasks?

---