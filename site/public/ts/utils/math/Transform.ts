import {Vector,V}  from "./Vector";
import {Matrix2x3} from "./Matrix";

/**
 * Class representing a Transform.
 * A Transform holds all the spacial information about an object.
 * (ex. position, rotating, size, etc.)
 *
 * For performance reasons the transform also stores a list of corners
 *  to be able to quickly apply intersection testing.
 */
export class Transform {
    private parent?: Transform;
    private pos: Vector;
    private scale: Vector;
    private angle: number;
    private size: Vector;

    private corners: Array<Vector>;
    private localCorners: Array<Vector>;

    private dirty: boolean;
    private dirtySize: boolean;
    private dirtyCorners: boolean;

    private prevParentMatrix: Matrix2x3;

    private matrix: Matrix2x3;
    private inverse: Matrix2x3;
    private radius: number;

    /**
     * Constructs a new Transform object
     *
     * @param  {Vector} pos     The initial position of the transform
     * @param  {Vector} size    The initial size of the transform
     * @param  {number} angle   The initial angle of the transform
     */
    constructor(pos: Vector, size: Vector, angle: number = 0) {
        this.parent = undefined;
        this.pos = V(pos.x, pos.y);
        this.size = V(size.x, size.y);
        this.angle = angle;
        this.scale = V(1, 1);
        this.corners = [];
        this.localCorners = [];
        this.prevParentMatrix = undefined;
        this.dirty = true;
        this.dirtySize = true;
        this.dirtyCorners = true;
        this.updateMatrix();
    }
    private updateMatrix(): void {
        // If parent changed then we need to recalculate matrix
        if (this.parent != undefined &&
            !this.parent.getMatrix().equals(this.prevParentMatrix))
            this.dirty = true;

        if (!this.dirty)
            return;
        this.dirty = false;

        this.matrix = new Matrix2x3();
        this.matrix.translate(this.pos);
        this.matrix.rotate(this.angle);
        this.matrix.scale(this.scale);

        if (this.parent != undefined) {
            this.matrix = this.parent.getMatrix().mult(this.matrix);
            this.prevParentMatrix = this.parent.getMatrix();
        }

        this.inverse = this.matrix.inverse();
    }
    private updateSize(): void {
        if (!this.dirtySize)
            return;
        this.dirtySize = false;

        this.localCorners = [this.size.scale(V(-0.5, 0.5)), this.size.scale(V(0.5, 0.5)),
                             this.size.scale(V(0.5, -0.5)), this.size.scale(V(-0.5, -0.5))];

        this.radius = Math.sqrt(this.size.x*this.size.x + this.size.y*this.size.y)/2;
    }
    private updateCorners(): void {
        // If parent changed then we need to recalculate corners
        if (this.parent != undefined &&
            !this.parent.getMatrix().equals(this.prevParentMatrix))
            this.dirtyCorners = true;

        if (!this.dirtyCorners)
            return;
        this.dirtyCorners = false;

        const corners = this.getLocalCorners();
        for (let i = 0; i < 4; i++)
            this.corners[i] = this.toWorldSpace(corners[i]);
    }

    /**
     * Rotates this transform 'a' radians about the axis 'c'
     *
     * @param {number} a The angle to rotate
     * @param {number} c The axis to rotate about
     */
    public rotateAbout(a: number, c: Vector): void {
        this.setAngle(this.getAngle() + a);
        this.setPos(this.pos.sub(c));
        const cos = Math.cos(a), sin = Math.sin(a);
        const xx = this.pos.x * cos - this.pos.y * sin;
        const yy = this.pos.y * cos + this.pos.x * sin;
        this.setPos(V(xx, yy).add(c));
        this.dirty = true;
        this.dirtyCorners = true;
    }
    public setRotationAbout(a: number, c: Vector): void {
        this.rotateAbout(-this.getAngle(), c);
        this.rotateAbout(a, c);
    }

    public setParent(t: Transform): void {
        this.parent = t;
        this.dirty = true;
        this.dirtyCorners = true;
    }
    public setPos(p: Vector): void {
        this.pos.x = p.x;
        this.pos.y = p.y;
        this.dirty = true;
        this.dirtyCorners = true;
    }
    public setAngle(a: number): void {
        this.angle = a;
        this.dirty = true;
        this.dirtyCorners = true;
    }
    public setScale(s: Vector): void {
        this.scale.x = s.x;
        this.scale.y = s.y;
        this.dirty = true;
    }
    public setSize(s: Vector): void {
        this.size.x = s.x;
        this.size.y = s.y;
        this.dirtySize = true;
        this.dirtyCorners = true;
    }
    public setWidth(w: number): void {
        this.size.x = w;
        this.dirtySize = true;
        this.dirtyCorners = true;
    }
    public setHeight(h: number): void {
        this.size.y = h;
        this.dirtySize = true;
        this.dirtyCorners = true;
    }

    /**
     * Converts the given Vector, v, to local space relative
     *  to this transform
     *
     * @param {Vector} v    The vector to transform
     *                      Must be in world coordinates
     *
     * @return {Vector}     The local space vector
     */
    public toLocalSpace(v: Vector): Vector { // v must be in world coords
        return this.getInverseMatrix().mul(v);
    }

    /**
     * Converts the given Vector, v, to world space relative
     *  to this transform
     *
     * @param {Vector} v    The vector to transform
     *                      Must be in local coordinates
     *
     * @return {Vector}     The world space vector
     */
    public toWorldSpace(v: Vector): Vector {
        return this.getMatrix().mul(v);
    }

    public getParent(): Transform {
        return this.parent;
    }
    public getPos(): Vector {
        return this.pos.copy();
    }
    public getAngle(): number {
        return this.angle;
    }
    public getScale(): Vector {
        return this.scale.copy();
    }
    public getSize(): Vector {
        return this.size.copy();
    }
    public getRadius(): number {
        this.updateSize();
        return this.radius;
    }
    public getMatrix(): Matrix2x3 {
        this.updateMatrix();
        return this.matrix.copy();
    }
    public getInverseMatrix(): Matrix2x3 {
        this.updateMatrix();
        return this.inverse;
    }
    public getTopLeft(): Vector {
        this.updateCorners();
        return this.corners[0];
    }
    public getTopRight(): Vector {
        this.updateCorners();
        return this.corners[1];
    }
    public getBottomRight(): Vector {
        this.updateCorners();
        return this.corners[2];
    }
    public getBottomLeft(): Vector {
        this.updateCorners();
        return this.corners[3];
    }
    public getCorners(): Array<Vector> {
        this.updateCorners();
        return this.corners.slice(); // Shallow copy array
    }
    public getLocalCorners(): Array<Vector> {
        this.updateSize();
        return this.localCorners.slice(); // Shallow copy array
    }

    public copy(): Transform {
        const trans = new Transform(this.pos.copy(), this.size.copy(), this.angle);
        trans.scale = this.scale.copy();
        trans.dirty = true;
        return trans;
    }
}
